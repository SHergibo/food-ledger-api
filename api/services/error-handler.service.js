const { loggerError } = require('../../config/logger.config'),
      Notifier = require('node-notifier'),
      { env, environments } = require('./../../config/environment.config');
      Boom = require('@hapi/boom');

exports.log = (err, req, res, next) => {
  let error = { "message": `Error in ${req.method} ${req.url}`, "stack": err.stack };
  loggerError.error(error);
  next(err);
};

exports.notify = (err, str, req) => {
  let title = `Error in ${req.method} ${req.url}`;
  Notifier.notify({
    title: title,
    message: str
  })
};

exports.exit = (err, req, res, next) => {
  let code = 500;
  let errorBoom = err;
  if (err.boom) errorBoom = err.boom;
  if (errorBoom.output) code = errorBoom.output.statusCode;
  if (errorBoom.httpsStatusCode) code = errorBoom.httpsStatusCode;
  if (env.toUpperCase() === environments.DEVELOPMENT) {
    if (err.error) console.log(err.error);
    console.log(errorBoom);
  }
  res.status(code);
  res.json(errorBoom);
};

exports.notFound = (req, res, next) => {
  res.status(404);
  res.json(Boom.notFound('End point not found'));
}