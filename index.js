'use strict'
if (process.env.ENV === 'production') require('newrelic')
const express = require('express')
const Alexa = require('alexa-app')
Alexa.App = Alexa.app // this is stupid
const Redis = require('ioredis')

const redis = new Redis(process.env.REDIS_URL || 'localhost:6379')
const handlers = require('./handlers')(redis)

const app = express()
const alexaApp = new Alexa.App(process.env.APP_NAME || 'alexa')

app.set('view engine', 'ejs')
alexaApp.express({
  endpoint: 'alexa',
  expressApp: app,
  checkCert: process.env.ENV === 'production',
  debug: !(process.env.ENV === 'production')
})

alexaApp.launch((req, res) => res.say('Try asking about the next train on an operator from a station.'))

alexaApp.intent('AMAZON.HelpIntent', {
  'slots': {},
  'utterances': [
    'how {do I|to} find a train schedule',
    '{|for} help'
  ]
}, (req, res) => res
  .say('You can ask \'what is the next train on some operator from a starting station. You can also filter down to only trips to a final station\'')
  .shouldEndSession(true))

alexaApp.intent('scheduleIntent', {
  'slots': {
    'ON': 'LITERAL',
    'FROM': 'LITERAL',
    'TO': 'LITERAL'
  },
  'utterances': [
    'when {is|are} the next {train|trains} on {redwood transit system|ON} from {fourteenth at b street|FROM} to {bayshore mall|TO}',
    'next {train|trains} on {redwood transit system|ON} from {fourteenth at b street|FROM} to {bayshore mall|TO}',
    'for the next {train|trains} on {redwood transit system|ON} from {fourteenth at b street|FROM} to {bayshore mall|TO}'
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
