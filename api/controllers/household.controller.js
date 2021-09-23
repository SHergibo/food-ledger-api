const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      { socketIoEmit, sendNotifToSocket } = require('./../helpers/socketIo.helper'),
      { transformNeedSwitchAdminToInviteNotif } = require('../helpers/transformNotification.helper');

/**
* Post one household
*/
exports.add = async (req, res, next) => {
  try {
    if(!req.user.householdId){
      const household = await Helpers.addHousehold({
        householdName: req.body.householdName,
        userId: req.user._id
      });
      let user = await User.findByIdAndUpdate(req.user._id, {role: "admin", householdId: household._id });
      return res.json({householdData : household.transform(), userData: user.transform()})
    }else{
     return next(Boom.forbidden("Vous ne pouvez pas créer de famille si vous en avez déjà une!"))
    }

  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* GET one household
*/
exports.findOne = async (req, res, next) => {
  try {
    const household = await Household.findById(req.params.householdId)
    .populate({
      path: 'members.userData',
      select: 'firstname lastname usercode role'
    }); 
    return res.json(household.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* PATCH household
*/
exports.update = async (req, res, next) => {
  try {
    const household = await Household.findByIdAndUpdate(req.params.householdId, req.body)
    .populate({
      path: 'members.userData',
      select: 'firstname lastname usercode role'
    });
    
    return res.json(household.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* PATCH Kick user from household
*/
exports.kickUser = async (req, res, next) => {
  try {
    let household = await Household.findById(req.params.householdId);
    let updatedArrayMembers = household.members.filter(member => member.userData.toString() !== req.body.userId);
    household = await Household.findByIdAndUpdate(household._id, { members: updatedArrayMembers })
    .populate({
      path: 'members.userData',
      select: 'firstname lastname usercode role'
    });

    if(household.members.length === 1){
      await transformNeedSwitchAdminToInviteNotif(household.userId);
    }

    let oldHousehold = await Household.findOne({userId : req.body.userId});
    let user;
    if(oldHousehold){
      user = await User.findByIdAndUpdate(req.body.userId, {role : "admin", householdId : oldHousehold._id});
      let oldArrayMembers = oldHousehold.members;
      let newMemberObject = {
        userData : user._id,
        isFlagged : false
      }
      oldArrayMembers = [...oldArrayMembers, newMemberObject];
      oldHousehold = await Household.findByIdAndUpdate(oldHousehold._id, { members: oldArrayMembers })
      .populate({
        path: 'members.userData',
        select: 'firstname lastname usercode role'
      });
      oldHousehold = oldHousehold.transform()
    }else{
      user = await User.findByIdAndUpdate(req.body.userId, {householdId : null});
      oldHousehold = undefined;
    }

    let findNotifOldHousehold = await Notification.find({householdId : household._id, userId: user._id});

    await sendNotifToSocket({userId : req.body.userId, notificationId : findNotifOldHousehold._id, type : "received"});

    await Notification.findByIdAndDelete(findNotifOldHousehold._id);

    socketIoEmit(req.body.userId, [
      {name : "updateUserAndFamillyData", data: {userData : user.transform(), householdData : oldHousehold}},
      {name : "deleteNotificationReceived", data: findNotifOldHousehold._id},
    ]);

    return res.json(household.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};