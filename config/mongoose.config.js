const Mongoose = require('mongoose');
const Logger = require('./logger.config');

const { mongo, env, environments } = require('./environment.config');

Mongoose.Promise = global.Promise;

Mongoose.set('useFindAndModify', false);
Mongoose.set('useCreateIndex', true);

Mongoose.connection.on('error', (err) =>{
    console.log(err)
    Logger.error(`MongoDB connection error: ${err}`);
    process.exit(-1);
})

if(env.toUpperCase() === environments.DEVELOPMENT){
    Mongoose.set('debug', true);
}

exports.connect = () => {
    console.log(mongo.uri)
    Mongoose.connect(mongo.uri, {
        keepAlive : 1,
        useNewUrlParser : true
    });
    Logger.info('MongoDB server is now running on port 27017');
    return Mongoose.connection;
}