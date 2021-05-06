const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      { socketIoEmit } = require('./../helpers/socketIo.helper'),
      { transformObject } = require('../helpers/transformJsonData.helper');

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
      let user = await User.findByIdAndUpdate(req.user._id, {role: "admin", householdId: household._id }, { override: true, upsert: true, new: true });
      return res.json({householdData : household.transform(), userData: user.transform()})
    }else{
     return next(Boom.forbidden("Vous ne pouvez pas créer de famille si vous en avez déjà une!"))
    }

  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
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
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH household
*/
exports.update = async (req, res, next) => {
  try {
    const household = await Household.findByIdAndUpdate(req.params.householdId, req.body, { override: true, upsert: true, new: true })
    .populate({
      path: 'members.userData',
      select: 'firstname lastname usercode role'
    });
    
    return res.json(household.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH Kick user from household
*/
exports.kickUser = async (req, res, next) => {
  try {
    let household = await Household.findById(req.params.householdId);
    let updatedArrayMembers = household.members.filter(member => member.userData.toString() !== req.body.userId);
    household = await Household.findByIdAndUpdate(household._id, { members: updatedArrayMembers }, { override: true, upsert: true, new: true })
    .populate({
      path: 'members.userData',
      select: 'firstname lastname usercode role'
    });

    if(household.members.length === 1){
      let needSwitchAdminNotification = await Notification.find({userId : household.userId, type: "need-switch-admin"});
      if(needSwitchAdminNotification.length >= 1){
        for (const notif of needSwitchAdminNotification) {
          const otherHousehold = await Household.findById(notif.householdId);
          let inviteNotification = await new Notification({
            message: `L'administrateur.trice de la famille ${otherHousehold.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
            householdId: notif.householdId,
            userId: notif.userId,
            type: "invitation-household-to-user",
            urlRequest: "add-user-respond",
          });
          await inviteNotification.save(); 

          await Notification.findByIdAndDelete(notif._id);

          socketIoEmit(notif.userId, 
            [
              {name : "deleteNotificationReceived", data: notif._id},
              {name : "updateNotificationReceived", data: inviteNotification.transform()},
            ]
          );

          let notificationSended = await Notification.findById(inviteNotification._id)
          .populate({
            path: 'userId',
            select: 'firstname lastname -_id'
          });

          socketIoEmit(otherHousehold.userId, 
            [
              {name : "deleteNotificationSended", data: notif._id},
              {name : "updateNotificationSended", data: transformObject(notificationSended, 'notification')},
            ]
          ); 
        }
      }
    }


    let oldHousehold = await Household.findOne({userId : req.body.userId});
    let user;
    if(oldHousehold){
      user = await User.findByIdAndUpdate(req.body.userId, {role : "admin", householdId : oldHousehold._id}, { override: true, upsert: true, new: true });
      let oldArrayMembers = oldHousehold.members;
      let newMemberObject = {
        userData : user._id,
        isFlagged : false
      }
      oldArrayMembers = [...oldArrayMembers, newMemberObject];
      oldHousehold = await Household.findByIdAndUpdate(oldHousehold._id, { members: oldArrayMembers }, { override: true, upsert: true, new: true })
      .populate({
        path: 'members.userData',
        select: 'firstname lastname usercode role'
      });
    }else{
      user = await User.findByIdAndUpdate(req.body.userId, {householdId : null}, { override: true, upsert: true, new: true });
      oldHousehold = undefined;
    }

    socketIoEmit(req.body.userId, [{name : "updateUserAndFamillyData", data: {userData : user, householdData : oldHousehold}}]);

    return res.json(household.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};