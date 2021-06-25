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
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* PATCH one user options
*/
exports.update = async (req, res, next) => {
  try {
    const option = await Option.findOne({userId : req.params.userId})
    const optionPatched = await Option.findByIdAndUpdate(option._id, req.body);
    return res.json(optionPatched.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};