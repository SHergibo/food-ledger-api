const Option = require('./../models/option.model'),
      Boom = require('@hapi/boom');

/**
* GET user options
*/
exports.findOne = async (req, res, next) => {
  try {
    const option = await Option.find({userId : req.params.userId});
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
    const option = await Option.findByIdAndUpdate(req.params.optionId, req.body, { override: true, upsert: true, new: true });
    return res.json(option.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};