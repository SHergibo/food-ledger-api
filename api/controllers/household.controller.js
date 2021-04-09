const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      { socketIoEmit } = require('./../helpers/socketIo.helper');

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
      oldHousehold = {};
    }

    socketIoEmit(req.body.userId, [{name : "updateUserAndFamillyData", data: {userData : user, householdData : oldHousehold}}]);

    return res.json(household.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};