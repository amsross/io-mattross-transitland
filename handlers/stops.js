'use strict'
const url = require('url')
const h = require('highland')
const r = require('ramda')
const { get, matchAgainst, mutateUrl } = require('./utils')

const baseUrl = url.parse('https://transit.land/api/v1/stops?offset=0&per_page=50&sort_key=id&sort_order=asc&served_by_vehicle_types=rail&served_by=foo', true)

module.exports = function(options) {

  const fuseConfig = {
    threshold: 0.3,
    keys: [
      { name: 'name', weight: 0.7 }
    ]
  }

  const getStops = operator => stop => url => h.of(url)
    .map(r.set(r.compose(r.lensProp("query"), r.lensProp("served_by")), operator))
    .map(mutateUrl)
    .flatMap(get)
    .compact()
    .flatMap(matchAgainst(fuseConfig)(getStops(operator))(stop)('stops'))

  return stop => operator => getStops(r.prop('onestop_id', operator))(stop)(baseUrl)
    .take(1)
}
