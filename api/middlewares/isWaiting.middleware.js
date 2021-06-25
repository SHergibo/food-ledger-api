const Boom = require('@hapi/boom');

exports.isWaiting = async (req, res, next) => {
  try {
    let household = req.res.locals.householdData;
    return household.isWaiting ? next(Boom.forbidden("Tant que votre famille n'a pas d'administrateur.trice, vous n'avez pas l'accès à cette fonction!")) : next();
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};