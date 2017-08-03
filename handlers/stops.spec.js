'use strict'
const h = require('highland')
const r = require('ramda')
const test = require('tape')
const nock = require('nock')
const { nockRepeater } = require('../test/helpers')

test('handlers/stops', assert => {
  const unit = require('./stops')

  const params = {
    offset: 0,
    per_page: 50,
    sort_key: 'id',
    sort_order: 'asc',
    served_by_vehicle_types: 'rail',
    served_by: 'o-9q9-caltrain'
  }

  const nockGet = () => nock('https://transit.land')
    .get('/api/v1/stops')

  r.map(offset => nockRepeater(responses)(nockGet())(r.evolve({
    offset: r.always(offset),
  })(params)))([
    0, 50,
    0, 50,
    0, 50, 100,
    0, 50,
    0, 50, 100
  ])

  h([
    ['san jose', {onestop_id: 's-9q9k659e3r-sanjosediridoncaltrain\u003c70261'}, 'direct match, 1st page'],
  ])
    .map(stop => unit({})(stop[0])('o-9q9-caltrain')
      .errors((err, push) => push(null, err))
      .tap(x => assert.ok(r.whereEq(stop[1])(x), stop[2])))
    .merge()
    .collect()
    .tap(xs => assert.ok(xs, 'got responses'))
    .tap(xs => assert.equal(xs.length, 1, 'got correct number of responses'))
    .done(assert.end)
})

const responses = [{
  "stops": [{
    "onestop_id": "s-9q9k659e3r-sanjosediridoncaltrain\u003c70261",
    "name": "San Jose Diridon Caltrain",
    "timezone": "America/Los_Angeles",
    "parent_stop_onestop_id": "s-9q9k659e3r-sanjosediridoncaltrain",
    "operators_serving_stop": [{
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain"
    }],
    "routes_serving_stop": [{
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Local",
      "route_onestop_id": "r-9q9-local"
    }, {
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Limited",
      "route_onestop_id": "r-9q9-limited"
    }, {
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Baby Bullet",
      "route_onestop_id": "r-9q9j-babybullet"
    }]
  }, {
    "onestop_id": "s-9q9k3rbss8-santaclaracaltrain<70241",
    "name": "Santa Clara Caltrain",
    "timezone": "America/Los_Angeles",
    "parent_stop_onestop_id": "s-9q9k3rbss8-santaclaracaltrain",
    "operators_serving_stop": [{
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain"
    }],
    "routes_serving_stop": [{
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Local",
      "route_onestop_id": "r-9q9-local"
    }, {
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Limited",
      "route_onestop_id": "r-9q9-limited"
    }]
  }, {
    "onestop_id": "s-9q9hxghkcb-lawrencecaltrain<70231",
    "name": "Lawrence Caltrain",
    "timezone": "America/Los_Angeles",
    "parent_stop_onestop_id": "s-9q9hxghkcb-lawrencecaltrain",
    "operators_serving_stop": [{
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain"
    }],
    "routes_serving_stop": [{
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Local",
      "route_onestop_id": "r-9q9-local"
    }, {
      "operator_name": "Caltrain",
      "operator_onestop_id": "o-9q9-caltrain",
      "route_name": "Limited",
      "route_onestop_id": "r-9q9-limited"
    }]
  }],
  "meta": {
    "sort_key": "id",
    "sort_order": "asc",
    "offset": 0,
    "per_page": 50,
    "served_by_vehicle_types": 'rail',
    "served_by": 'o-9q9-caltrain',
    "next": "https://transit.land/api/v1/stops?offset=50&per_page=3&served_by=o-9q9-caltrain&served_by_vehicle_types=rail&sort_key=id&sort_order=asc"
  }
}]
