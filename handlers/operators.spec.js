'use strict'
const h = require('highland')
const r = require('ramda')
const test = require('tape')
const nock = require('nock')
const { nockRepeater } = require('../test/helpers')

test('handlers/operators', assert => {
  const unit = require('./operators')

  const params = {
    offset: 0,
    per_page: 50,
    sort_key: 'id',
    sort_order: 'asc'
  }

  const nockGet = () => nock('https://transit.land')
    .get('/api/v1/operators')

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
    ['caltrain', {onestop_id: 'o-9q9-caltrain'}, 'direct match, 1st page'],
    ['VTA', {onestop_id: 'o-9q9-vta'}, 'direct match, 2nd page'],
    ['Contra Costa Transit', {onestop_id: 'o-9q9-actransit'}, 'close match 2nd page'],
    ['PATH', {onestop_id: 'o-dr5r-path'}, 'direct match, 3rd page'],
    ['qwerty123456', {message: 'match for qwerty123456 was not found in operators'}, 'should 404'],
  ])
    .map(operator => unit({})(operator[0])
      .errors((err, push) => push(null, err))
      .tap(x => assert.ok(r.whereEq(operator[1])(x), operator[2])))
    .merge()
    .collect()
    .tap(xs => assert.ok(xs, 'got responses'))
    .tap(xs => assert.equal(xs.length, 5, 'got correct number of responses'))
    .done(assert.end)
})

const responses = [{
  "operators": [{
    "onestop_id": "o-9q9-caltrain",
    "name": "Caltrain",
    "short_name": null,
    "timezone": "America/Los_Angeles",
    "represented_in_feed_onestop_ids": ["f-9q9-caltrain"]
  }, {
    "onestop_id": "o-9q9-bart",
    "name": "Bay Area Rapid Transit",
    "short_name": "BART",
    "timezone": "America/Los_Angeles",
    "represented_in_feed_onestop_ids": ["f-9q9-bart"]
  }],
  "meta": {
    "sort_key": "id",
    "sort_order": "asc",
    "offset": 0,
    "per_page": 50,
    "next": "https://transit.land/api/v1/operators?offset=50&per_page=50&sort_key=id&sort_order=asc"
  }
}, {
  "operators": [{
    "onestop_id": "o-9q9-vta",
    "name": "Santa Clara Valley Transportation Authority",
    "short_name": "VTA",
    "timezone": "America/Los_Angeles",
    "represented_in_feed_onestop_ids": [
      "f-9q9-vta"
    ]
  }, {
    "onestop_id": "o-9q9-actransit",
    "name": "Alameda-Contra Costa Transit District",
    "short_name": "AC Transit",
    "timezone": "America/Los_Angeles",
    "represented_in_feed_onestop_ids": [
      "f-9q9-actransit"
    ]
  }],
  "meta": {
    "sort_key": "id",
    "sort_order": "asc",
    "offset": 50,
    "per_page": 50,
    "prev": "https://transit.land/api/v1/operators?offset=0&per_page=50&sort_key=id&sort_order=asc",
    "next": "https://transit.land/api/v1/operators?offset=100&per_page=50&sort_key=id&sort_order=asc"
  }
}, {
  "operators": [{
    "onestop_id": "o-dr5r-nyct",
    "name": "MTA New York City Transit",
    "short_name": "MTA",
    "timezone": "America/New_York",
    "represented_in_feed_onestop_ids": [
      "f-dr5r-nyctsubway",
      "f-dr5r-mtanyctbusbrooklyn",
      "f-dr5r-mtanyctbusmanhattan",
      "f-dr5r-mtanyctbusstatenisland",
      "f-dr5x-mtanyctbusqueens",
      "f-dr72-mtanyctbusbronx",
      "f-dr5r-mtabc"
    ]
  }, {
    "onestop_id": "o-dr5r-path",
    "name": "Port Authority Trans-Hudson",
    "short_name": "PATH",
    "timezone": "America/New_York",
    "represented_in_feed_onestop_ids": [
      "f-dr5r-path~nj~us"
    ]
  }],
  "meta": {
    "sort_key": "id",
    "sort_order": "asc",
    "offset": 100,
    "per_page": 50,
    "prev": "https://transit.land/api/v1/operators?offset=50&per_page=50&sort_key=id&sort_order=asc"
  }
}]
