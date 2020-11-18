const Logger = require('./config/logger.config');
const CronJob = require('cron').CronJob;
const NotificationCronJob = require('./api/tasks/notification.cronjob.task');
const EmailCronJob = require('./api/tasks/email.cronjob.task');

const [major, minor] = process.versions.node.split('.').map(parseFloat);

if(major < 7 || major === 7 && minor <= 5){
    Logger.error('Node version is too low');
    process.exit(1);
}

const { port, env } = require('./config/environment.config');

const App = require ('./config/app.config');
const Mongoose =require ('./config/mongoose.config');

Mongoose.connect();

App.listen( port, () => Logger.info(`HTTP server is now running on port ${port} (${env})`));

// const nofificationJob = new CronJob('1 * * * * *', NotificationCronJob.cronJob);
// nofificationJob.start();

//* 0 0 * * 0 (dernier jour de la semaine à 0h00)
const shoppingListEmailJob = new CronJob('* 0 0 * * 0', EmailCronJob.shoppingListEmail);
//* 0 0 1 * * (premier jour de chaque mois à 0h00)
const globalEmailJob = new CronJob('* 0 0 1 * *', EmailCronJob.globalEmail);

//shoppingListEmailJob.start();
//globalEmailJob.start();

module.exports = App;