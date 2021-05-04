const request = require("supertest"),
      app = require("../../../config/app.config"), 
      { api } = require('../../../config/environment.config'),
      { login } = require('../../login.helper'),
      Household = require('../../../api/models/household.model'),
      User = require('../../../api/models/user.model'),
      Notification = require('../../../api/models/notification.model'),
      data = require('../../test-data');

const requestApi = async (notificationId, accessTokenUser, queryParams) => {
  return await request(app)
  .get(`/api/${api}/requests/delegate-admin/${notificationId}${queryParams}`)
  .set('Authorization', `Bearer ${accessTokenUser}`);
};

module.exports.userAcceptDelegateAdmin = async ({userdata, username, notificationId, householdOne, householdTwo}) => {
  let createInviteNotification = await new Notification({
    message: "Notification invitation household to user",
    householdId: householdOne._id,
    userId: userdata._id,
    type: "invitation-household-to-user",
    urlRequest: "add-user-respond",
  });
  await createInviteNotification.save();

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = '?acceptedRequest=yes';
  const acceptNotification = await requestApi(notificationId, accessTokenUser, queryParams);

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
  });

  return { acceptNotification, DeletedNotification, householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo, invitationNotification, tranformedNotification };
};

module.exports.userRejectDelegateAdminWithOtherMember = async ({userdata, username, notificationId, householdTwo, userThree}) => {
  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = `?acceptedRequest=no&otherMember=${userThree._id}`;
  const rejectNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const DeletedNotification = await Notification.findOne({
    userId : userdata._id,
    householdId : userdata.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  const userThreeNotification = await Notification.findOne({
    userId : userThree._id,
    householdId : userThree.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  const householdTwoUpdated = await Household.findById(householdTwo._id);
  const userTwoIsFlagged = householdTwoUpdated.members.find(member => member.userData.toString() === userdata._id.toString());

  return { rejectNotification, DeletedNotification, userThreeNotification, userTwoIsFlagged };
};

module.exports.testErrorUserRejectDelegateAdminWithoutOtherMember = async ({userdata, username, notificationId}) => {
  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = `?acceptedRequest=no`;
  const rejectNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const checkNotification = await Notification.findOne({
    userId : userdata._id,
    householdId : userdata.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  return { rejectNotification, checkNotification };
};

module.exports.userRejectDelegateAdminWithoutOtherMember = async ({userdata, username, notificationId, householdTwo, userTwo, householdThree}) => {
  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = `?acceptedRequest=no`;
  const rejectNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const DeletedNotification = await Notification.findOne({
    userId : userdata._id,
    householdId : userdata.householdId,
    type: "request-delegate-admin",
    urlRequest : "delegate-admin",
  });

  const checkHouseholdTwo = await Household.findById(householdTwo._id);
  const checkUserTwo = await User.findById(userTwo._id);
  const checkHouseholdThree = await Household.findById(householdThree._id);
  const checkUserThree = await User.findById(userdata._id);

  return { rejectNotification, DeletedNotification, checkHouseholdTwo, checkUserTwo, checkHouseholdThree, checkUserThree };
};