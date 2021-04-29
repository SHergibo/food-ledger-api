const request = require("supertest"),
      app = require("../../../config/app.config"), 
      { api } = require('../../../config/environment.config'),
      { login } = require('../../login.helper'),
      Household = require('../../../api/models/household.model'),
      User = require('../../../api/models/user.model'),
      Notification = require('../../../api/models/notification.model'),
      data = require('../../test-data');

module.exports.userAcceptNotificationRequestDelegateAdmin = async ({userdata, username, notificationId, householdOne, householdTwo}) => {

  let createInviteNotification = await new Notification({
    message: "Notification invitation household to user",
    householdId: householdOne._id,
    userId: userdata._id,
    type: "invitation-household-to-user",
    urlRequest: "add-user-respond",
  });
  await createInviteNotification.save();

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const acceptNotification = await request(app)
  .get(`/api/${api}/requests/delegate-admin/${notificationId}?acceptedRequest=yes`)
  .set('Authorization', `Bearer ${accessTokenUser}`);

  const DeletedNotification = await Notification.findOne({
    userId : userdata._id,
    householdId : userdata.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  const householdTwoAfterNewAdmin = await Household.findById(householdTwo._id);
  const newAdminIndex = householdTwoAfterNewAdmin.members.findIndex(member => member.userData.toString() === userdata._id.toString());

  const newAdminTwo = await User.findById(userdata._id);

  const invitationNotification = await Notification.findById(createInviteNotification._id);
  const tranformedNotification = await Notification.findOne({
    userId : userdata._id,
    type: 'need-switch-admin',
    householdId: householdOne._id
  })

  return { acceptNotification, DeletedNotification, householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo, invitationNotification, tranformedNotification };
};