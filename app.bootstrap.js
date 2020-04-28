const Logger = require('./config/logger.config');

const [major, minor] = process.versions.node.split('.').map(parseFloat);

if(major < 7 || major === 7 && minor <= 5){
    Logger.error('Node version is too low');
    process.exit(1);
}

const { port, env } = require('./config/environment.config');

const App = require ('./config/app.config');
const Mongoose =require ('./config/mongoose.config');

// Mongoose.connect();

App.listen( port, () => Logger.info(`HTTP server is now running on port ${port} (${env})`));

module.exports = App;