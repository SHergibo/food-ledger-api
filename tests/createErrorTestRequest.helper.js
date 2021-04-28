const request = require("supertest"),
      app = require("../config/app.config"),
      { api } = require('../config/environment.config'),
      Notification = require('../api/models/notification.model'),
      { login } = require('./login.helper');

module.exports.createErrorTest = async (adminData, urlRequest, objectNotif, queryParams = '') => {
  await request(app)
    .post(`/api/${api}/users`)
    .send(adminData);

  let notifId;
  if(objectNotif){
    let createNotification = await new Notification(objectNotif);
    await createNotification.save();
    notifId = createNotification._id;
  }else{
    notifId = '606dad080ac1c22766b37a53';
  }

  const accessTokenAdmin = await login(adminData.email, adminData.password);

  const res = await request(app)
    .get(`/api/${api}/requests/${urlRequest}/${notifId}${queryParams}`)
    .set('Authorization', `Bearer ${accessTokenAdmin}`);

  return {statusCode : res.statusCode, error : JSON.parse(res.error.text)};
};