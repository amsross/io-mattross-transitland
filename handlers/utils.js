'use strict'
const url = require('url')
const F = require('fuse.js')
const h = require('highland')
const q = require('request')
const r = require('ramda')
const { wordsToNumbers } = require('words-to-numbers')
const errors = require('restify-errors')
const expire = 1 * 60 * 60 * 24 * 7 * 52

module.exports.checkRedis = redis => type => match => otherwise => {
  const key = `transitland:${type}:${match}`.replace(/ /g, '')
  return h.wrapCallback(redis.get.bind(redis))(key)
    .compact()
    .map(JSON.parse)
    .otherwise(otherwise)
    .compact()
    .tap(r.compose(
      result => redis.set(key, result, 'EX', expire),
      JSON.stringify))
}

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
    .map(r.map(r.reject(r.isNil)))
    .flatMap(r.pipe(
      r.construct(F)(r.__, fuseConfig),
      r.invoker(1, 'search')('' + (wordsToNumbers(match) || match))))
    .otherwise(() => {
      if (!response.meta.next) return h.fromError(new errors.NotFoundError(`match for ${match} was not found in ${prop}`))
      return recurse(match)(url.parse(response.meta.next, true))
    })
}
