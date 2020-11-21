const {createLogger, format, transports} = require('winston');
const {combine, timestamp, json} = format;

const { env, environments } = require('./../config/environment.config');

const enumerateErrorFormat = format(info => {
    if (info.message instanceof Error) {
      info.message = Object.assign({
        message: info.message.message,
        stack: info.message.stack
      }, info.message);
    }
  
    if (info instanceof Error) {
      return Object.assign({
        message: info.message,
        stack: info.stack
      }, info);
    }
  
    return info;
  });

const loggerError = createLogger({
    format : combine(
        enumerateErrorFormat(),
        timestamp(),
        json(),
    ),
    transports : [
        new transports.File({filename : 'logs/error.log', level : 'error'}),
    ]
});

const loggerInfo = createLogger({
    format : combine(
        enumerateErrorFormat(),
        timestamp(),
        json(),
    ),
    transports : [
        new transports.File({filename : 'logs/info.log', level: 'info'})
    ]
});

if(env.toUpperCase() !== environments.PRODUCTION){
    loggerInfo.add(new transports.Console({format : format.simple()}));
}

module.exports = {loggerError, loggerInfo};