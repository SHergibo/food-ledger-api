const {loggerError} = require('../../config/logger.config'),
      Notifier = require('node-notifier'),
      Boom = require('@hapi/boom');

exports.log = (err, req, res, next) =>{
    let error = {"message" : `Error in ${req.method} ${req.url}`, "stack": err.stack};
    loggerError.error(error);
    next(err);
};

exports.notify = (err, str, req) => {
    let title = `Error in ${req.method} ${req.url}`;
    Notifier.notify({
        title : title,
        message : str
    })
};

exports.exit = (err, req, res, next) =>{
    let code = typeof(err.output.statusCode) !== 'undefined' ? err.output.statusCode : 500;
    res.status(code);
    res.json(err);
};

exports.notFound = (req, res, next) => {
    res.status(404);
    res.json(Boom.notFound('End point not found'));
}