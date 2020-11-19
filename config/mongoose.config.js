const Mongoose = require('mongoose');
const {loggerError, loggerInfo} = require('./logger.config');

const { mongo, env, environments } = require('./environment.config');

Mongoose.Promise = global.Promise;

Mongoose.set('useFindAndModify', false);
Mongoose.set('useCreateIndex', true);

Mongoose.connection.on('error', (err) =>{
    console.log(err)
    loggerError.error(`MongoDB connection error: ${err}`);
    process.exit(-1);
})

if(env.toUpperCase() === environments.DEVELOPMENT){
    Mongoose.set('debug', true);
}

exports.connect = () => {
    Mongoose.connect(mongo.uri, {
        keepAlive : 1,
        useNewUrlParser : true,
        useUnifiedTopology: true,
    });
    if(env.toUpperCase() === environments.PRODUCTION){
        loggerInfo.info('MongoDB server is now running on port 27017');
    }
    return Mongoose.connection;
}