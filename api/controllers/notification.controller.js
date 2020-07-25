const Notification = require('./../models/notification.model'),
      Boom = require('@hapi/boom');


/**
* GET all notifications
*/
exports.findAll = async (req, res, next) => {
    try {
        const notifications = await Notification.find({userId : req.params.userId});
        const fields = ['_id', 'message', 'type', 'urlRequest', 'expirationDate'];
        let arrayNotificationsTransformed = [];
        notifications.forEach((item)=>{
            const object = {};
            fields.forEach((field)=>{
                object[field] = item[field];
            });
            arrayNotificationsTransformed.push(object);
        });
        return res.json(arrayNotificationsTransformed);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};