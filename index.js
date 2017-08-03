'use strict'
const r = require('ramda')
const express = require('express')
const alexa = require('alexa-app')
const bunyan = require('bunyan')
const bunyanMiddleware = require('bunyan-middleware')
const handlers = require('./handlers')

const app = express()
const alexaApp = new alexa.app(process.env.APP_NAME || 'alexa');
const logger = bunyan.createLogger({name: process.env.APP_NAME || 'alexa'})

app.use(bunyanMiddleware({
  headerName: 'X-Request-Id',
  propertyName: 'reqId',
  logName: 'req_id',
  logger: logger,
}))
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
    'next train on {-|ON} from {-|FROM}',
    'next train on {-|ON} from {-|FROM} to {-|TO}'
  ]
}, (req, res) => handlers.next(req, {
  ON: req.slot('ON'),
  FROM: req.slot('FROM'),
  TO: req.slot('TO')
})
  .collect()
  .toCallback((err, results) => {
    if (err) return res.say(err.message)
    return r.compose(
      x => res.say(x),
      obj => `The next trains on ${obj.operator_name} from ${obj.stop_name}` +
        (req.slot('TO') ? ` to ${req.slot('TO')}` : ``) +
        ` are ${obj.schedules}`,
      r.evolve({
        schedules: r.compose(
          r.map(schedule => `${schedule.origin_departure_time} to ${schedule.trip_headsign}`),
          r.join(', '))
      }),
      r.identity)(results)
  }))

app.get('/next/:ON/:FROM/:TO', (req, res, next) => handlers.next(req, req.params)
  .collect()
  .tap(json => res.json(json))
  .toCallback(err => next(err)))

app.get('/next/:ON/:FROM', (req, res, next) => handlers.next(req, req.params)
  .collect()
  .tap(json => res.json(json))
  .toCallback(err => next(err)))

app.listen(process.env.PORT || 8080, () =>
  console.log(`listening on ${process.env.PORT || 8080} in ${process.env.ENV || 'development'} mode`))
