const Household = require('./../models/household.model'),
      Boom = require('@hapi/boom');

exports.addProductHousehold = async (req, res, next) => {
  try {
    const household = await Household.findOne({householdcode: req.user.householdcode});

    if(!household) return next(Boom.notFound("Cette famille n'existe pas !"));

    req.body.householdId = household._id;
    return next();

  } catch (error) {
    next(Boom.badImplementation(error.message));
  }

};