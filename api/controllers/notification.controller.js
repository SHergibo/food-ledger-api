const Notification = require('./../models/household.model'),
      Boom = require('@hapi/boom');


/**
* GET all notifications
*/
exports.findAll = async (req, res, next) => {
    try {
        const notifications = await Notification.find({userId : req.params.userId});
        return res.json(notifications);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};