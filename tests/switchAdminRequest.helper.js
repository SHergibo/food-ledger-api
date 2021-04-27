const request = require("supertest"),
      app = require("../config/app.config"), 
      { api } = require('../config/environment.config'),
      { login } = require('./login.helper'),
      Household = require('../api/models/household.model'),
      User = require('../api/models/user.model'),
      Notification = require('../api/models/notification.model'),
      { userTwoDataComplete } = require('./test-data');

module.exports.userAcceptNotificationRequestDelegateAdmin = async (userTwo, notificationId, householdTwo) => {
  const accessTokenUserTwo = await login(userTwoDataComplete.email, userTwoDataComplete.password);

  const acceptNotification = await request(app)
  .get(`/api/${api}/requests/delegate-admin/${notificationId}?acceptedRequest=yes`)
  .set('Authorization', `Bearer ${accessTokenUserTwo}`);

  const DeletedNotification = await Notification.findOne({
    userId : userTwo._id,
    householdId : userTwo.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  const householdTwoAfterNewAdmin = await Household.findById(householdTwo._id);
  const newAdminIndex = householdTwoAfterNewAdmin.members.findIndex(member => member.userData.toString() === userTwo._id.toString());

  const newAdminTwo = await User.findById(userTwo._id);

  return { acceptNotification, DeletedNotification, householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo };
};