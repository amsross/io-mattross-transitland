'use strict'
const url = require('url')
const F = require('fuse.js')
const h = require('highland')
const q = require('request')
const r = require('ramda')
const errors = require('restify-errors')

module.exports.checkRedis = type => match => otherwise => otherwise

module.exports.mutateUrl = r.compose(
  url.format,
  r.omit(['search']))

module.exports.get = url => {
  return h.wrapCallback(q.get, r.nthArg(1))(url)
    .map(JSON.parse)
}

module.exports.matchAgainst = fuseConfig => recurse => match => prop => response => {
  return h.of(response)
    .map(r.prop(prop))
    .flatMap(r.pipe(
      r.construct(F)(r.__, fuseConfig),
      r.invoker(1, 'search')(match)))
    .otherwise(() => {
      if (!response.meta.next) return h.fromError(new errors.NotFoundError(`match for ${match} was not found in ${prop}`))
      return recurse(match)(url.parse(response.meta.next, true))
    })
}
