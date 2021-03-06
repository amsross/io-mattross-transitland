'use strict'
const url = require('url')
const h = require('highland')
const r = require('ramda')
const { get, matchAgainst, mutateUrl } = require('./utils')

const baseUrl = url.parse('https://transit.land/api/v1/operators?country=us,ca,gb&offset=0&per_page=50&sort_key=id&sort_order=asc', true)

module.exports = function (options) {
  const fuseConfig = {
    threshold: 0.2,
    keys: [
      { name: 'short_name', weight: 0.7 },
      { name: 'name', weight: 0.3 }
    ]
  }

  const getOperators = operator => url => h.of(url)
    .map(mutateUrl)
    .flatMap(get)
    .compact()
    .flatMap(matchAgainst(fuseConfig)(getOperators)(operator)('operators'))

  return operator => getOperators(operator)(baseUrl)
    .take(1)
    .tap(r.compose(
      result => options.log.info(result, `found operator for term '${operator}'`),
      r.objOf('operator'),
      r.pickBy(r.is(String))))
}
