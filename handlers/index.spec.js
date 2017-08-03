const h = require('highland')
const test = require('tape')
const nock = require('nock')
const sinon = require('sinon')

test('handlers/index', assert => {
  const unit = require('./index')

  assert.test('next', assert => {

    const req = { log: { info: () => {} } }
    const clock = sinon.useFakeTimers(1506423600000)

    nock('https://transit.land')
      .get('/api/v1/operators')
      .query({
        sort_key: 'id',
        sort_order: 'asc',
        offset: 0,
        per_page: 50,
      })
      .thrice()
      .reply(200, responses[0])

    nock('https://transit.land')
      .get('/api/v1/stops')
      .query({
        offset: 0,
        per_page: 50,
        sort_key: 'id',
        sort_order: 'asc',
        served_by_vehicle_types: 'rail',
        served_by: 'o-dr4e-portauthoritytransitcorporation'
      })
      .thrice()
      .reply(200, responses[1])

    nock('https://transit.land')
      .get('/api/v1/schedule_stop_pairs')
      .query({
        sort_key: 'origin_departure_time',
        sort_order: 'asc',
        offset: 0,
        per_page: 50,
        origin_onestop_id: 's-dr4durps7v-haddonfield',
        origin_departure_between: '07:00,23:59',
        date: '2017-09-26',
      })
      .thrice()
      .reply(200, responses[2])

    h([{
      ON: 'patco',
      FROM: 'haddonfield'
    }, {
      ON: 'patco',
      FROM: 'haddonfield',
      TO: 'philadelphia'
    }, {
      ON: 'patco',
      FROM: 'haddonfield',
      TO: 'lindenwold'
    }])
      .flatMap(params => unit.next(req, params))
      .collect()
      .tap(results => {
        assert.equal(results[0].operator_name, 'PATCO')
        assert.equal(results[0].stop_name, 'Haddonfield')
        assert.deepEqual(results[0].schedules[0], {trip_headsign: 'Philadelphia', origin_departure_time: '07:04am'}, 'first trip: westbound')
        assert.deepEqual(results[0].schedules[1], {trip_headsign: 'Philadelphia', origin_departure_time: '07:09am'}, 'second trip: westbound')
        assert.deepEqual(results[0].schedules[2], {trip_headsign: 'Lindenwold', origin_departure_time: '07:10am'}, 'first trip: eastbound')

        assert.equal(results[1].operator_name, 'PATCO')
        assert.equal(results[1].stop_name, 'Haddonfield')
        assert.deepEqual(results[1].schedules[0], {trip_headsign: 'Philadelphia', origin_departure_time: '07:04am'}, 'first trip: westbound')
        assert.deepEqual(results[1].schedules[1], {trip_headsign: 'Philadelphia', origin_departure_time: '07:09am'}, 'second trip: westbound')

        assert.deepEqual(results[2].schedules[0], {trip_headsign: 'Lindenwold', origin_departure_time: '07:10am'}, 'first trip: eastbound')
      })
      .collect()
      .tap(xs => assert.ok(xs.length, 'got responses'))
      .done(() => {
        nock.cleanAll()
        clock.restore()
        assert.end()
      })
  })

  assert.end()
})

const responses = [{
  'operators': [{
    'onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'name': 'Port Authority Transit Corporation',
    'short_name': 'PATCO',
    'timezone': 'America/New_York',
    'represented_in_feed_onestop_ids': [
      'f-dr4e-patco'
    ]
  }, {
    'onestop_id': 'o-dnwg-blacksburgtransit',
    'name': 'Blacksburg Transit',
    'short_name': 'BT',
    'timezone': 'America/New_York',
    'represented_in_feed_onestop_ids': [
      'f-dnwg-bt4u'
    ]
  }],
  'meta': {
    'sort_key': 'id',
    'sort_order': 'asc',
    'offset': 0,
    'per_page': 50,
    'next': 'https://transit.land/api/v1/operators?offset=50&per_page=50&sort_key=id&sort_order=asc'
  }
}, {
  "stops": [{
    "onestop_id": "s-dr4durps7v-haddonfield",
    "name": "Haddonfield",
    "timezone": "America/New_York",
    "parent_stop_onestop_id": null,
    "operators_serving_stop": [{
      "operator_name": "Port Authority Transit Corporation",
      "operator_onestop_id": "o-dr4e-portauthoritytransitcorporation"
    }],
    "routes_serving_stop": [{
      "operator_name": "Port Authority Transit Corporation",
      "operator_onestop_id": "o-dr4e-portauthoritytransitcorporation",
      "route_name": "PATCO",
      "route_onestop_id": "r-dr4e-patco"
    }]
  }, {
    "onestop_id": "s-dr4dv44krr-woodcrest",
    "name": "Woodcrest",
    "timezone": "America/New_York",
    "parent_stop_onestop_id": null,
    "operators_serving_stop": [{
      "operator_name": "Port Authority Transit Corporation",
      "operator_onestop_id": "o-dr4e-portauthoritytransitcorporation"
    }],
    "routes_serving_stop": [{
      "operator_name": "Port Authority Transit Corporation",
      "operator_onestop_id": "o-dr4e-portauthoritytransitcorporation",
      "route_name": "PATCO",
      "route_onestop_id": "r-dr4e-patco"
    }]
  }],
  "meta": {
    "sort_key": "id",
    "sort_order": "asc",
    "offset": 0,
    "per_page": 50,
    "next": "https://transit.land/api/v1/stops?offset=50&per_page=50&served_by=o-dr4e-portauthoritytransitcorporation&served_by_vehicle_types=rail&sort_key=id&sort_order=asc"
  }
}, {
  'schedule_stop_pairs': [{
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'destination_onestop_id': 's-dr4eh2bg8u-westmont',
    'route_onestop_id': 'r-dr4e-patco',
    'operator_onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'origin_timezone': 'America/New_York',
    'trip_headsign': 'Philadelphia',
    'origin_departure_time': '07:04:00',
    'destination_arrival_time': '07:06:00',
  }, {
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'destination_onestop_id': 's-dr4eh2bg8u-westmont',
    'route_onestop_id': 'r-dr4e-patco',
    'operator_onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'origin_timezone': 'America/New_York',
    'trip_headsign': 'Philadelphia',
    'origin_departure_time': '07:09:00',
    'destination_arrival_time': '07:11:00',
  }, {
    'origin_onestop_id': 's-dr4durps7v-haddonfield',
    'destination_onestop_id': 's-dr4dv44krr-woodcrest',
    'route_onestop_id': 'r-dr4e-patco',
    'operator_onestop_id': 'o-dr4e-portauthoritytransitcorporation',
    'origin_timezone': 'America/New_York',
    'destination_timezone': 'America/New_York',
    'trip_headsign': 'Lindenwold',
    'origin_departure_time': '07:10:00',
    'destination_arrival_time': '07:13:00',
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
