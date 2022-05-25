const Mongoose = require("mongoose");
const { loggerError, loggerInfo } = require("./logger.config");

const { mongo, env, environments } = require("./environment.config");

Mongoose.Promise = global.Promise;

Mongoose.set("returnOriginal", false);

Mongoose.connection.on("error", (err) => {
  if (env.toUpperCase() === environments.PRODUCTION) {
    loggerError.error(`MongoDB connection error: ${err}`);
  } else {
    console.log(err);
  }
  process.exit(-1);
});

if (env.toUpperCase() === environments.DEVELOPMENT) {
  Mongoose.set("debug", true);
}

exports.connect = () => {
  Mongoose.connect(mongo.uri, {
    keepAlive: 1,
  });
  if (env.toUpperCase() === environments.PRODUCTION) {
    loggerInfo.info("MongoDB server is now running on port 27017");
  } else {
    console.log("MongoDB server is now running on port 27017");
  }
  return Mongoose.connection;
};
