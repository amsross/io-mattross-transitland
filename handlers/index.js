const h = require('highland')
const r = require('ramda')
const q = require('request')
const operators = require('./operators')
const stops = require('./stops')
const schedules = require('./schedules')

module.exports.next = function next(req) {

  const options = {}

  return operators(options)(req.params.on)
    .flatMap(stops(options)(req.params.from))
    .flatMap(schedules(options))
}
