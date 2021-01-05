const NodeMailer = require('nodemailer'),
      hbs = require('nodemailer-express-handlebars'),
      config = require('./../../config/secrets'),
      { google } = require('googleapis'),
      { OAuth2 } = google.auth,
      OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground',
      { loggerError } = require('./../../config/logger.config');

/**
* Send mail
*/
exports.send = async (output, subject) => {
  try {
    const { MAIL, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = config;
    const oauth2Client = new OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      OAUTH_PLAYGROUND
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });
    const accessToken = oauth2Client.getAccessToken();

    let transporter = NodeMailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: MAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken,
      }
    });

    const options = {
      viewEngine: {
        defaultLayout: false
      },
      viewPath: `${process.cwd()}/api/views/`,
    };

    transporter.use('compile', hbs(options));
    
    let mailOptions = {
      from: `"Gestion de stock" <${MAIL}>`,
      to: MAIL,
      subject: subject,
      template: 'email',
      context: {
        output: `${output}`
      }
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        loggerError.error(error);
        return error;
      }
    });
  } catch (error) {
    loggerError.error(error);
  }
};