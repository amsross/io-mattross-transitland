'use strict'
const r = require('ramda')
const nock = require('nock')

module.exports.nockRepeater = responses => endpoint => query =>
  endpoint
    .query(query)
    .reply(200, findResponseIn(responses)(query))

const findResponseIn = responses => query => r.compose(
  r.flip(r.find)(responses),
  query => r.compose(
    r.whereEq(query),
    r.propOr({}, 'meta')))(query)
