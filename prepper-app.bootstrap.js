const {loggerInfo} = require('./config/logger.config');
const CronJob = require('cron').CronJob;
const NotificationCronJob = require('./api/tasks/notification.cronjob.task');
const EmailCronJob = require('./api/tasks/email.cronjob.task');

const [major, minor] = process.versions.node.split('.').map(parseFloat);

if(major < 7 || major === 7 && minor <= 5){
    loggerInfo.error('Node version is too low');
    process.exit(1);
}

const { port, env, environments } = require('./config/environment.config');

const App = require ('./config/app.config');
const Mongoose =require ('./config/mongoose.config');

Mongoose.connect();

// const nofificationJob = new CronJob('1 * * * * *', NotificationCronJob.cronJob);

//* 0 0 * * 0 (dernier jour de la semaine à 0h00)
const shoppingListEmailJob = new CronJob('* 0 0 * * 0', EmailCronJob.shoppingListEmail);
//* 0 0 1 * * (premier jour de chaque mois à 0h00)
const globalEmailJob = new CronJob('* 0 0 1 * *', EmailCronJob.globalEmail);

App.listen( port, () => {
    if(env.toUpperCase() === environments.PRODUCTION){
        loggerInfo.info(`HTTP server is now running on port ${port} (${env})`);
        // nofificationJob.start();
        shoppingListEmailJob.start();
        globalEmailJob.start();
    }else{
        console.log(`HTTP server is now running on port ${port} (${env})`);
    }
}).on('error', (err) => {
    loggerError.error(`Server connection error: ${err}`);
});


module.exports = App;