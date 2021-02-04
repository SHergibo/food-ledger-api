const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      socketIo = require('./../../config/socket-io.config'),
      SocketIoModel = require('./../models/socketIo.model'),
      { socketIoNotification } = require('./../helpers/socketIo.helper');

/**
* Post one household
*/
exports.add = async (req, res, next) => {
  try {
    const household = await Helpers.addHousehold(req.body);
    return res.json(household.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* GET one household
*/
exports.findOne = async (req, res, next) => {
  try {
    const household = await Household.findOne({ householdCode: req.params.householdCode });
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
    const household = await Household.findByIdAndUpdate(req.params.householdId, req.body, { override: true, upsert: true, new: true });
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
    let updatedArrayMember = household.member.filter(member => member.userId.toString() !== req.body.userId);
    household = await Household.findByIdAndUpdate(household._id, { member: updatedArrayMember }, { override: true, upsert: true, new: true });

    //pas de famille => householdCode : none
    let oldHousehold = await Household.findOne({userId : req.body.userId});
    let socketIoKickUser = await SocketIoModel.findOne({ userId: req.body.userId });
    if(oldHousehold){
      let user = await User.findByIdAndUpdate(req.body.userId, {role : "admin", householdCode : oldHousehold.householdCode}, { override: true, upsert: true, new: true });
      let oldArrayMember = oldHousehold.member;
      let newMemberObject = {
        userId : user._id,
        usercode : user.usercode,
        firstname : user.firstname,
        lastname : user.lastname,
        isFlagged : false
      }
      oldArrayMember.push(newMemberObject);
      oldHousehold = await Household.findByIdAndUpdate(oldHousehold._id, { member: oldArrayMember }, { override: true, upsert: true, new: true });

      if(socketIoKickUser){
        const io = socketIo.getSocketIoInstance();
        io.to(socketIoKickUser.socketId).emit("updateUserAndFamillyData", {userData : user, householdData : oldHousehold});
      }

    }else{
      let user = await User.findByIdAndUpdate(req.body.userId, {householdCode : "none"}, { override: true, upsert: true, new: true });
      if(socketIoKickUser){
        const io = socketIo.getSocketIoInstance();
        io.to(socketIoKickUser.socketId).emit("updateUserAndFamillyData", {userData : user, householdData : {}});
      }
    }

    return res.json(household.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};