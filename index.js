const restify = require('restify')

const server = restify.createServer()
const handlers = require('./handlers')

function respond(fn) {
  return (req, res, next) => {
    return fn(req)
      .collect()
      .tap(json => res.json(json))
      .errors((err, push) => {
        console.error(err)
        push(err)
      })
      .toCallback(err => next(err))
  }
}

server.get('/next/:on/:from/:to', respond(handlers.next))
server.get('/next/:on/:from', respond(handlers.next))

server.listen(process.env.PORT || 8080, () => console.log('%s listening at %s', server.name, server.url))
