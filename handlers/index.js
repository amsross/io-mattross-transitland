'use strict'
const F = require('fuse.js')
const h = require('highland')
const m = require('moment-timezone')
const r = require('ramda')
const q = require('request')
const operators = require('./operators')
const stops = require('./stops')
const schedules = require('./schedules')

module.exports.next = function next(params) {

  const options = {}
  const fuseConfig = {
    threshold: 0.3,
    keys: [
      { name: 'trip_headsign', weight: 0.7 }
    ]
  }

  return operators(options)(params.ON)
    .flatMap(stops(options)(params.FROM))
    .flatMap(schedules(options))
    .collect()
    .flatMap(params.TO ? r.pipe(
      r.construct(F)(r.__, fuseConfig),
      r.invoker(1, "search")(params.TO)) : r.identity)
    .sortBy((a, b) => {
      const one = m(a.origin_departure_time, 'hh:mma')
      const two = m(b.origin_departure_time, 'hh:mma')
      return one.diff(two)
    })
    .take(5)
}
