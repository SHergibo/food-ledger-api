const Option = require('./../models/option.model'),
      Boom = require('@hapi/boom');

/**
* GET user options
*/
exports.findOne = async (req, res, next) => {
  try {
    const option = await Option.findOne({userId : req.params.userId});
    return res.json(option.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
* PATCH one user options
*/
exports.update = async (req, res, next) => {
  try {
    const option = await Option.findOne({userId : req.params.userId})
    const optionPatched = await Option.findByIdAndUpdate(option._id, req.body, { override: true, upsert: true, new: true });
    return res.json(optionPatched.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};