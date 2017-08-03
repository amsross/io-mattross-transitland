const express = require('express')
const handlers = require('./handlers')

const app = express()

app.get('/next/:on/:from/:to', respond(handlers.next))
app.get('/next/:on/:from', respond(handlers.next))
app.get('/next/:on/:from/:to', (req, res, next) => handlers.next(req.params)
  .collect()
  .tap(json => res.json(json))
  .toCallback(err => next(err)))

app.get('/next/:on/:from', (req, res, next) => handlers.next(req.params)
  .collect()
  .tap(json => res.json(json))
  .toCallback(err => next(err)))

app.listen(process.env.PORT || 8080, () =>
  console.log(`listening on ${process.env.PORT || 8080} in ${process.env.ENV || 'development'} mode`))
