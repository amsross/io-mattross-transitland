'use strict'
const r = require('ramda')
const express = require('express')
const alexa = require('alexa-app')
const handlers = require('./handlers')

const app = express()
const alexaApp = new alexa.app(process.env.APP_NAME || 'alexa');

app.set('view engine', 'ejs')
alexaApp.express({
  endpoint: 'alexa',
  expressApp: app,
  checkCert: process.env.ENV === 'production' ? true : false,
  debug: process.env.ENV === 'production' ? false : true,
})

alexaApp.launch((req, res) => response.say('Try asking about the next train on an operator from a station.'))
alexaApp.intent('trainIntent', {
  'slots': {
    'ON': 'LITERAL',
    'FROM': 'LITERAL',
    'TO': 'LITERAL'
  },
  'utterances': [
    'when {is|are} the next {train|trains} on {patco|ON} from {haddonfield|FROM}',
    'when {is|are} the next {train|trains} on {patco|ON} from {haddonfield|FROM} to {philadelphia|TO}',
    'next {train|trains} on {patco|ON} from {haddonfield|FROM}',
    'next {train|trains} on {patco|ON} from {haddonfield|FROM} to {philadelphia|TO}'
  ]
}, (req, res) => new Promise((resolve, reject) => handlers.alexa(req)
  .errors(err => res.say(err.message))
  .tap(response => res.say(response))
  .done(resolve)))

app.get('/next/:ON/:FROM/:TO', (req, res, next) => handlers.next(req.params)
  .tap(json => res.json(json))
  .toCallback(err => next(err)))

app.get('/next/:ON/:FROM', (req, res, next) => handlers.next(req.params)
  .tap(json => res.json(json))
  .toCallback(err => next(err)))

app.listen(process.env.PORT || 8080, () =>
  console.log(`listening on ${process.env.PORT || 8080} in ${process.env.ENV || 'development'} mode`))
