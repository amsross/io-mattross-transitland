'use strict'
const url = require('url')
const r = require('ramda')

module.exports.mutateUrl = r.compose(
  url.format,
  r.omit(['search']))
