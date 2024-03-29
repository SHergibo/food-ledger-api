const request = require("supertest"),
      app = require("../../../config/app.config"),
      { api } = require('../../../config/environment.config'),
      { login } = require('../../global-helper/login.helper'),
      Household = require('../../../api/models/household.model'),
      User = require('../../../api/models/user.model'),
      Notification = require('../../../api/models/notification.model'),
      data = require('../../test-data');

const requestApi = async (notificationId, accessTokenUser, queryParams) => {
  return await request(app)
    .get(`/api/${api}/requests/delegate-admin/${notificationId}${queryParams}`)
    .set('Authorization', `Bearer ${accessTokenUser}`);
};

const createInviteNotification = async (householdId, userId) => {
  let createInviteNotification = await new Notification({
    message: "Notification invitation household to user",
    householdId: householdId,
    userId: userId,
    type: "invitation-household-to-user",
    urlRequest: "add-user-respond",
  });
  return await createInviteNotification.save();
};

const checkNotification = async (userdata, type) => {
  return await Notification.findOne({
    userId: userdata._id,
    householdId: userdata.householdId,
    type: type,
    urlRequest: "delegate-admin",
  });
};

const checkNewAdminChange = async (userdata) => {
  const householdTwoAfterNewAdmin = await Household.findById(userdata.householdId);
  const newAdminIndex = householdTwoAfterNewAdmin.members.findIndex(member => member.userData.toString() === userdata._id.toString());

  const newAdminTwo = await User.findById(userdata._id);

  return { householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo };
};

const checkTransformedInviteNotification = async (notifId, userId, householdId) => {
  const checkInviteNotification = await Notification.findById(notifId);
  const tranformedNotification = await Notification.findOne({
    userId: userId,
    type: 'need-switch-admin',
    householdId: householdId
  });

  return { checkInviteNotification, tranformedNotification };
};


const checkUpdatedData = async (householdTwoId, userTwoId, householdThreeId, userThreeId) => {
  const checkHouseholdTwo = await Household.findById(householdTwoId);
  const checkUserTwo = await User.findById(userTwoId);
  const checkHouseholdThree = await Household.findById(householdThreeId);
  const checkUserThree = await User.findById(userThreeId);

  return { checkHouseholdTwo, checkUserTwo, checkHouseholdThree, checkUserThree };
};

const checkNumberOfLastChanceNotif = async (notifications) => {
  let numberOfLastChanceNotification = 0;
  for (const notif of notifications) {
    let checkNotifExist = await Notification.findById(notif.notification._id);
    if (checkNotifExist) {
      numberOfLastChanceNotification++;
    }
  }
  return numberOfLastChanceNotification;
};

module.exports.userAcceptDelegateAdmin = async ({ userdata, username, notificationId, householdOne }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = '?acceptedRequest=yes';
  const acceptNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const deletedNotification = await checkNotification(userdata, "request-delegate-admin");

  const { householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo } = await checkNewAdminChange(userdata);

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { acceptNotification, deletedNotification, householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo, checkInviteNotification, tranformedNotification, inviteNotificationId : inviteNotification._id.toString() };
};

module.exports.userRejectDelegateAdminWithOtherMember = async ({ userdata, username, notificationId, householdOne, householdTwo, userThree }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = `?acceptedRequest=no&otherMember=${userThree._id}`;
  const rejectNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const deletedNotification = await checkNotification(userdata, "request-delegate-admin");

  const userThreeNotification = await checkNotification(userThree, "request-delegate-admin");

  const householdTwoUpdated = await Household.findById(householdTwo._id);
  const userTwoIsFlagged = householdTwoUpdated.members.find(member => member.userData.toString() === userdata._id.toString());

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { rejectNotification, deletedNotification, userThreeNotification, userTwoIsFlagged, checkInviteNotification, tranformedNotification };
};

module.exports.testErrorUserRejectDelegateAdminWithoutOtherMember = async ({ userdata, username, notificationId, householdOne }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = `?acceptedRequest=no`;
  const rejectNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const checkNotificationExist = await checkNotification(userdata, "request-delegate-admin");

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { rejectNotification, checkNotificationExist, checkInviteNotification, tranformedNotification };
};

module.exports.userRejectDelegateAdminWithoutOtherMember = async ({ userdata, username, notificationId, householdOne, householdTwo, userTwo, householdThree }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = `?acceptedRequest=no`;
  const rejectNotification = await requestApi(notificationId, accessTokenUser, queryParams);

  const deletedNotification = await checkNotification(userdata, "request-delegate-admin");

  const { checkHouseholdTwo, checkUserTwo, checkHouseholdThree, checkUserThree } = await checkUpdatedData(householdTwo._id, userTwo._id, householdThree._id, userdata._id);

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { rejectNotification, deletedNotification, checkHouseholdTwo, checkUserTwo, checkHouseholdThree, checkUserThree, checkInviteNotificationUserThree : checkInviteNotification, tranformedNotificationUserThree : tranformedNotification };
};

module.exports.createLastChanceDelegateAdminNotif = async (usersData, householdId) => {
  let lastChanceDelegateNotifArray = [];
  for (const userData of usersData) {
    let userNotif = await new Notification({
      message: "Notification last-chance-request-delegate-admin to user",
      householdId: householdId,
      userId: userData.userId,
      type: "last-chance-request-delegate-admin",
      urlRequest: "delegate-admin",
    });
    await userNotif.save();
    lastChanceDelegateNotifArray = [...lastChanceDelegateNotifArray, { username: userData.username, notification: userNotif }];
  }
  return lastChanceDelegateNotifArray;
};

module.exports.userAcceptLastChanceDelegateAdmin = async ({ userdata, username, notifications, householdOne }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = '?acceptedRequest=yes';
  const notifData = notifications.find(notif => notif.username === username);
  const acceptNotification = await requestApi(notifData.notification._id, accessTokenUser, queryParams);

  let allNotifDeleted = true;
  for (const notif of notifications) {
    let checkNotifExist = await Notification.findById(notif.notification._id);
    if (checkNotifExist) return allNotifDeleted = false;
  }

  const { householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo } = await checkNewAdminChange(userdata);

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { acceptNotification, allNotifDeleted, householdTwoAfterNewAdmin, newAdminIndex, newAdminTwo, checkInviteNotification, tranformedNotification };
};

module.exports.userRejectLastChanceDelegateAdmin = async ({ userdata, username, notifications, householdOne }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = '?acceptedRequest=no';
  const notifData = notifications.find(notif => notif.username === username);
  const rejectNotification = await requestApi(notifData.notification._id, accessTokenUser, queryParams);

  const deletedNotification = await checkNotification(userdata, "last-chance-request-delegate-admin");

  const numberOfLastChanceNotification = await checkNumberOfLastChanceNotif(notifications);

  const checkNumberLastChanceNotif = numberOfLastChanceNotification === notifications.length - 1 ? true : false;

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { rejectNotification, deletedNotification, checkNumberLastChanceNotif, checkInviteNotification, tranformedNotification, inviteNotification };
};

module.exports.lastUserRejectLastChanceDelegateAdmin = async ({ userdata, username, notifications, householdOne, householdTwo, userTwo, householdThree }) => {
  const inviteNotification = await createInviteNotification(householdOne._id, userdata._id);

  const accessTokenUser = await login(data[`${username}DataComplete`].email, data[`${username}DataComplete`].password);

  const queryParams = '?acceptedRequest=no';
  const notifData = notifications.find(notif => notif.username === username);
  const rejectNotification = await requestApi(notifData.notification._id, accessTokenUser, queryParams);

  const deletedNotification = await checkNotification(userdata, "last-chance-request-delegate-admin");

  const numberOfLastChanceNotification = await checkNumberOfLastChanceNotif(notifications);

  const checkNumberLastChanceNotif = numberOfLastChanceNotification === 0 ? true : false;

  const { checkHouseholdTwo, checkUserTwo, checkHouseholdThree, checkUserThree } = await checkUpdatedData(householdTwo._id, userTwo._id, householdThree._id, userdata._id);

  const { checkInviteNotification, tranformedNotification } = await checkTransformedInviteNotification(inviteNotification._id, userdata._id, householdOne._id);

  return { rejectNotification, deletedNotification, checkNumberLastChanceNotif, checkHouseholdTwo, checkUserTwo, checkHouseholdThree, checkUserThree, checkInviteNotification, tranformedNotification, inviteNotification };
};