'use strict'
const F = require('fuse.js')
const h = require('highland')
const m = require('moment-timezone')
const r = require('ramda')
const q = require('request')
const operators = require('./operators')
const stops = require('./stops')
const schedules = require('./schedules')

module.exports.next = function next(req, params) {

  const options = {}
  const fuseConfig = {
    threshold: 0.3,
    keys: [
      { name: 'trip_headsign', weight: 0.7 }
    ]
  }
  if (req && req.log && req.log.info) req.log.info(params)

  return operators(options)(params.ON)
    .flatMap(operator => stops(options)(params.FROM)(operator)
      .flatMap(stop => schedules(options)(stop)
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
        .collect()
        .map(schedules => ({
          operator_name: operator.short_name || operator.name,
          stop_name: stop.short_name || stop.name,
          schedules: schedules || [],
        }))))
}
