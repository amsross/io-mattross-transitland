'use strict'
const F = require('fuse.js')
const h = require('highland')
const m = require('moment-timezone')
const r = require('ramda')
const operators = require('./operators')
const stops = require('./stops')
const schedules = require('./schedules')
const { checkRedis } = require('./utils')
const bunyan = require('bunyan')
const log = bunyan.createLogger({name: process.env.APP_NAME || 'app'})

module.exports = redis => {
  return {
    next: next,
    alexa: alexa
  }

  function next (params) {
    log.info(params, 'received params')

    const options = {
      log: log
    }
    const fuseConfig = {
      threshold: 0.3,
      keys: [
        { name: 'trip_headsign', weight: 0.7 }
      ]
    }

    const getOperator = on => checkRedis(redis)('operator')(on)(operators(options)(on))
    const getStop = on => from => checkRedis(redis)(r.prop('onestop_id')(on))(from)(stops(options)(from)(on))

    return h.of(params)
      .map(params => {
        if (!params.ON) throw new Error('An operator is required.')
        if (!params.FROM) throw new Error('An origin station is required.')
        return params
      })
      .flatMap(params => getOperator(params.ON))
      .flatMap(operator => getStop(operator)(params.FROM)
        .flatMap(stop => schedules(options)(stop)
          .collect()
          .flatMap(params.TO ? r.pipe(
            r.construct(F)(r.__, fuseConfig),
            r.invoker(1, 'search')(params.TO)) : r.identity)
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
            schedules: schedules || []
          }))))
  }

  function alexa (req) {
    const params = {
      ON: req.slot('ON'),
      FROM: req.slot('FROM'),
      TO: req.slot('TO')
    }

    return next(params)
      .map(r.compose(
        obj => `The next trains on ${obj.operator_name} from ${obj.stop_name}` +
        (params.TO ? ` to ${params.TO}` : ``) +
        ` are ${obj.schedules}`,
        r.evolve({
          schedules: r.compose(
            r.join(', '),
            r.map(schedule => `${schedule.origin_departure_time} to ${schedule.trip_headsign}`))
        })))
  }
}
