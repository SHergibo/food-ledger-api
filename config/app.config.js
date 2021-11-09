const Express = require('express'),
  Morgan = require('morgan'),
  Cors = require('cors'),
  Helmet = require('helmet'),
  Compression = require('compression'),
  mongoSanitize = require('express-mongo-sanitize'),
  Router = require('./../api/routes/v1'),
  Passport = require('passport'),
  Strategies = require('./passport.config'),
  ServiceErrorHandler = require('../api/services/error-handler.service'),
  hbs = require('express-hbs');

const { HTTPLogs, api, env, environments, CorsOrigin } = require('./environment.config');

const app = Express();

app.engine('hbs', hbs.express4({
  defaultLayout : `${process.cwd()}/api/views/layouts/404-layout.hbs`
}));

app.set('views', `${process.cwd()}/api/views`);

app.set('view engine', 'hbs');

app.use(Helmet());

app.use(Compression());

app.use(Express.static('public'));

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

app.use(mongoSanitize());

app.use(Cors({
  origin: CorsOrigin
}));

app.use(Passport.initialize());

Passport.use('jwt', Strategies.jwt);

app.use(`/api/${api}`, Router);

app.use(Morgan(HTTPLogs));

if (env.toUpperCase() === environments.DEVELOPMENT) {
  app.use(ServiceErrorHandler.exit);
  app.use(ServiceErrorHandler.notFound);
} else {
  app.use(ServiceErrorHandler.log, ServiceErrorHandler.exit);
  app.use(ServiceErrorHandler.notFound);
}

const server = require('http').Server(app);
require('./socket-io.config').initializeSocketIo(server, CorsOrigin);

module.exports = server;