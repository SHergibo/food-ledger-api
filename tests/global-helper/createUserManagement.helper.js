const Household = require('../../api/models/household.model'),
      User = require('../../api/models/user.model'),
      Option = require('../../api/models/option.model'),
      cryptoRandomString = require('crypto-random-string');

module.exports.createUser = async ({userData, clientSocket}) => {
  let createdUser = await new User({
    firstname: userData.firstname,
    lastname: userData.lastname,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    usercode: cryptoRandomString({length: 10, type: 'url-safe'}),
  });
  await createdUser.save();

  let option = new Option({userId : createdUser._id});
  await option.save();

  createdUser = await User.findByIdAndUpdate(createdUser._id, { optionId: option._id }).lean();

  if(clientSocket){
    clientSocket.emit('enterSocketRoom', {socketRoomName: createdUser._id});
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${createdUser._id}/notificationReceived/0`});
    clientSocket.emit('enterSocketRoom', {socketRoomName: `${createdUser._id}/notificationSended/0`});
  }

  return createdUser;
};

module.exports.createHousehold = async (userId, householdName) => {
  let newHousehold = new Household({
    members: [
      {userData : userId, isFlagged: false}
    ],
    householdName: householdName,
    userId: userId,
    householdCode: cryptoRandomString({length: 10, type: 'url-safe'}),
    lastChance : new Date(),
  });
  return await newHousehold.save();
};

module.exports.updateUserHouseholdId = async (userId, householdId) => {
  return await User.findByIdAndUpdate(userId, { householdId: householdId });
};

module.exports.updateHouseholdMembers = async (householdId, membersArray, userId) => {
  return await Household.findByIdAndUpdate(householdId, { members: [...membersArray, {isFlagged : false, userData : userId}] });
};