const Express = require('express'),
    Morgan = require('morgan'),
    Cors = require('cors'),
    Helmet = require('helmet'),
    Compression = require('compression'),
    Router = require('./../api/routes/v1'),
    Passport = require('passport'),
    Strategies = require('./passport.config'),
    ServiceErrorHandler = require('../api/services/error-handler.service');

const { HTTPLogs, api, env, environments, CorsOrigin } = require('./environment.config');

const app = Express();

app.use(Helmet());

app.use(Compression());

app.use(Express.static('public'));

app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

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

module.exports = app;