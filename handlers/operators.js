'use strict'
const url = require('url')
const F = require('fuse.js')
const h = require('highland')
const r = require('ramda')
const q = require('request')
const errors = require('restify-errors')
const utils = require('./utils')

const get = url => {
  return h.wrapCallback(q.get, (err, body, res) => body)(url)
    .map(JSON.parse)
}
const baseUrl = url.parse('https://transit.land/api/v1/operators?offset=0&per_page=50&sort_key=id&sort_order=asc', true)

module.exports = function(options) {

  const fuseConfig = {
    threshold: 0.3,
    keys: [
      { name: 'short_name', weight: 0.7 },
      { name: 'name', weight: 0.3 }
    ]
  }

  const getOperators = operator => url => h.of(url)
    .map(utils.mutateUrl)
    .flatMap(get)
    .compact()
    .flatMap(response => {
      return h.of(response)
        .map(r.prop('operators'))
        .flatMap(r.pipe(
          r.construct(F)(r.__, fuseConfig),
          r.invoker(1, "search")(operator)))
        .otherwise(() => {
          if (!response.meta.next) return h.fromError(new errors.NotFoundError('operator not found'))
          return getOperators(operator)(url.parse(response.meta.next, true))
        })
    })

  return operator => getOperators(operator)(baseUrl)
}
