const Boom = require('@hapi/boom');

/**
* Trigger launch script
*/
exports.launch = async (req, res, next) => {
  try {
    return res.status(204).send();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};