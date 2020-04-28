const Winston = require('winston');

const logger = Winston.createLogger({
    level : 'info',
    format : Winston.format.json(),
    transports : [
        new Winston.transports.File({filename : 'logs/error.log', level : 'error'}),
        new Winston.transports.File({filename : 'log.combined.log'})
    ]
});

if(process.env.NODE_ENV !== "production"){
    logger.add(new Winston.transports.Console({format : Winston.format.simple()}));
}

logger.stream = {
    write: (message) =>{
        logger.info(message.trim());
    }
};

module.exports = logger;