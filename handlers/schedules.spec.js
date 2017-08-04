'use strict'
const h = require('highland')
const r = require('ramda')
const test = require('tape')
const nock = require('nock')
const sinon = require('sinon')
const { nockRepeater } = require('../test/helpers')

test('handlers/schedules', assert => {
  const unit = require('./schedules')
  const clock = sinon.useFakeTimers(1506423600000)

  const params = {
    offset: 0,
    per_page: 50,
    sort_key: 'origin_departure_time',
    sort_order: 'asc',
    origin_onestop_id: 's-dr4durps7v-haddonfield',
    origin_departure_between: '07:00,23:59',
    date: '2017-09-26'
  }

  const nockGet = () => nock('https://transit.land')
    .get('/api/v1/schedule_stop_pairs')

  r.map(offset => nockRepeater(responses)(nockGet())(r.evolve({
    offset: r.always(offset)
  })(params)))([
    0, 50,
    0, 50,
    0, 50, 100,
    0, 50,
    0, 50, 100
  ])

  h([
    [{
      onestop_id: 's-dr4durps7v-haddonfield',
      timezone: 'America/New_York'
    }, {
      trip_headsign: 'Philadelphia',
      origin_departure_time: '07:04am'
    }, 'direct match, 1st page']
  ])
    .map(schedule => unit({})(schedule[0])
      .errors((err, push) => push(null, err))
      .tap(x => assert.ok(r.whereEq(schedule[1])(x), schedule[2])))
    .merge()
    .take(1)
    .collect()
    .tap(xs => assert.ok(xs, 'got responses'))
    .done(() => {
      clock.restore()
      assert.end()
    })
})

const responses = [{
  'schedule_stop_pairs': [{
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'destination_onestop_id': 's-dr4eh2bg8u-westmont',
    'route_onestop_id': 'r-dr4e-patco',
    'operator_onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'origin_timezone': 'America/New_York',
    'trip_headsign': 'Philadelphia',
    'origin_departure_time': '07:04:00',
    'destination_arrival_time': '07:06:00'
  }, {
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'destination_onestop_id': 's-dr4eh2bg8u-westmont',
    'route_onestop_id': 'r-dr4e-patco',
    'operator_onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'origin_timezone': 'America/New_York',
    'trip_headsign': 'Philadelphia',
    'origin_departure_time': '07:09:00',
    'destination_arrival_time': '07:11:00'
  }, {
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'destination_onestop_id': 's-dr4dv44krr-woodcrest',
    'route_onestop_id': 'r-dr4e-patco',
    'operator_onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'origin_timezone': 'America/New_York',
    'destination_timezone': 'America/New_York',
    'trip_headsign': 'Lindenwold',
    'origin_departure_time': '07:10:00',
    'destination_arrival_time': '07:13:00'
  }],
  'meta': {
    'sort_key': 'origin_departure_time',
    'sort_order': 'asc',
    'offset': 0,
    'per_page': 50,
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'origin_departure_between': '07:00,23:59',
    'date': '2017-09-26',
    'next': 'https://transit.land/api/v1/schedule_stop_pairs?date=2017-09-26&offset=0&origin_onestop_id=s-dr4durps7v-haddonfield&per_page=50&sort_key=origin_departure_time&sort_order=asc'
  }
}]
