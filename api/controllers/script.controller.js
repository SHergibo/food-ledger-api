const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      Boom = require('@hapi/boom');


/**
* Trigger launch script
*/
exports.launch = async (req, res, next) => {
  // try {
  //   const users = await User.find({}).lean();

  //   users.forEach(async (user) => {
  //     let household = await Household.findOne({householdCode: user.householdCode});
  //     await User.findByIdAndUpdate(user._id, { householdId: household._id, $unset: { householdCode: 1 } });
  //   });

  //   return res.status(204).send();
  // } catch (error) {
  //   next(Boom.badImplementation(error.message));
  // }
};