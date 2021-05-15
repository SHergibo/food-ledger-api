const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      Boom = require('@hapi/boom');


/**
* Trigger launch script
*/
exports.launch = async (req, res, next) => {
  try {
    const users = await User.find({}).lean();

    users.forEach(async (user) => {
      let household = await Household.findOne({householdCode: user.householdCode});
      await User.findByIdAndUpdate(user._id, { householdId: household._id, $unset: { householdCode: 1 } });
    });

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Trigger householdMember script
*/
exports.householdMember = async (req, res, next) => {
  try {
    const households = await Household.find({}).lean();

    households.forEach(async (household) => {
      const member = household.member;
      let members = [];
      member.forEach((member) => {
        let objectMember = {
          userData : member.userId,
          isFlagged : member.isFlagged,
        }
        members = [...members, objectMember];
      });
      await Household.findByIdAndUpdate(household._id, { members: members, $unset: { member: 1 } });
    });

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* Test socketIo notification
*/
exports.testNotifSocketIo = async (req, res, next) => {
  try {
    const users = await User.find({});

    users.forEach(async (user) => {
      let newNotification = await new Notification({
        message: `Test notification socketIo`,
        type: 'information',
        householdId: user.householdId,
        userId: user._id,
      });
      await newNotification.save();
      socketIoEmit(user._id, [{name : "updateNotificationReceived", data: newNotification.transform()}]);
    });

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};