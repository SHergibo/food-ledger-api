const request = require("supertest"),
      app = require("../../../config/app.config"), 
      { api } = require('../../../config/environment.config'),
      { login } = require('../../login.helper'),
      Notification = require('../../../api/models/notification.model'),
      User = require('../../../api/models/user.model'),
      Household = require('../../../api/models/household.model'),
      {adminTwoDataComplete, userTwoDataComplete} = require('../../test-data'),
      {createUser, createHousehold, updateUserHouseholdId} = require('../../global-helper/createUserManagement.helper');

const switchAdminRightsRequestRespond = async (notification, accessToken, queryParams) => {
  return await request(app)
  .get(`/api/${api}/requests/switch-admin-rights-respond/${notification._id}?acceptedRequest=${queryParams}`)
  .set('Authorization', `Bearer ${accessToken}`);
};

const createNotif = async (objectNotifData) => {
  let createRequestNotif = await new Notification(objectNotifData);
  return await createRequestNotif.save();
};

const createNotificationToTransform = async (adminOneId, userTwoId ) => {
  let adminTwo = await createUser({userData : adminTwoDataComplete});
  let householdTwo = await createHousehold(adminTwo._id, adminTwoDataComplete.householdName);
  adminTwo = await updateUserHouseholdId(adminTwo._id, householdTwo._id);

  const adminOneNotif = await createNotif({
    message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation? Si oui, il faudra déléguer vos droits d'administrations à un.e autre membre de votre famille avant de pouvoir changer de famille.`,
    householdId: householdTwo._id,
    userId: adminOneId,
    type: "need-switch-admin",
    urlRequest: "add-user-respond"
  });

  const userTwoNotif = await createNotif({
    message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
    householdId: householdTwo._id,
    userId: userTwoId,
    type: "invitation-household-to-user",
    urlRequest: "add-user-respond"
  });

  return { adminOneNotif, userTwoNotif };
};

module.exports.switchAdminRightsRespondRequest = async (notification, adminOne, userTwo, householdOne, queryParams) => {
  const { adminOneNotif, userTwoNotif } = await createNotificationToTransform(adminOne._id, userTwo._id);
  const accessTokenUserOne = await login(userTwoDataComplete.email, userTwoDataComplete.password);

  const response = await switchAdminRightsRequestRespond(notification, accessTokenUserOne, queryParams);

  const deletedNotification = await Notification.findById(notification._id);
  const adminOneAfterUpdate = await User.findById(adminOne._id);
  const userTwoAfterUpdate = await User.findById(userTwo._id);
  const householdOneAfterUpdate = await Household.findById(householdOne._id);
  const userTwoIndex = householdOneAfterUpdate.members.findIndex(member => member.userData.toString() === userTwo._id.toString());
  const adminOneNotifAfterUpdate = await Notification.findById(adminOneNotif._id);
  const userTwoNotifAfterUpdate = await Notification.findById(userTwoNotif._id);

  const adminOneNotifTransformed = await Notification.findOne({
    userId: adminOne._id,
    type: "invitation-household-to-user",
  });

  const userTwoNotifTransformed = await Notification.findOne({
    userId: userTwo._id,
    type: "need-switch-admin",
  });

  let informationNotif;
  if(queryParams === 'no') {
    informationNotif = await Notification.findOne({
      householdId: notification.householdId,
      type: "information",
    });
  }

  return {
    statusCode : response.statusCode, 
    deletedNotification, 
    adminOneAfterUpdate, 
    userTwoAfterUpdate, 
    householdOneAfterUpdate, 
    userTwoIndex,
    adminOneNotifAfterUpdate,
    userTwoNotifAfterUpdate,
    adminOneNotifTransformed,
    userTwoNotifTransformed,
    informationNotif
  };
};
