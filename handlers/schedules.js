'use strict'
const url = require('url')
const h = require('highland')
const m = require('moment-timezone')
const r = require('ramda')
const { get, mutateUrl } = require('./utils')

const baseUrl = url.parse('https://transit.land/api/v1/schedule_stop_pairs?offset=0&per_page=50&sort_key=origin_departure_time&sort_order=asc&origin_onestop_id=foo&origin_departure_between=foo&date=foo', true)

module.exports = function (options) {
  const getSchedules = stop => url => h.of(url)
    .map(r.compose(
      r.set(r.lensPath(['query', 'origin_onestop_id']), r.prop('onestop_id')(stop)),
      r.over(r.lensPath(['query', 'origin_departure_between']), () => {
        const now = m().tz(r.prop('timezone', stop))
        const then = now.clone().endOf('d')
        return `${now.format('HH:mm')},${then.format('HH:mm')}`
      }),
      r.over(r.lensPath(['query', 'date']), () => {
        return m().tz(r.prop('timezone', stop)).format('YYYY-MM-DD')
      })
    ))
    .map(mutateUrl)
    .flatMap(get)
    .compact()

  return stop => getSchedules(stop)(baseUrl)
    .map(r.prop('schedule_stop_pairs'))
    .flatten()
    .map(r.applySpec({
      'trip_headsign': r.prop('trip_headsign'),
      'origin_departure_time': schedule => {
        const time = schedule.origin_departure_time
        const now = m().tz(r.prop('origin_timezone', schedule))
        return m(now.format('YYYY-MM-DD ') + time).format('hh:mma')
      }
    }))
}
