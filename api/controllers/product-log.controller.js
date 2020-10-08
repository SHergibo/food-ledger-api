const ProductLog = require('./../models/product-log.model'),
      Household = require('./../models/household.model'),
      Boom = require('@hapi/boom');


/**
* GET all product log
*/
exports.findAll = async (req, res, next) => {
    try {
        const household = await Household.findOne({householdCode : req.params.householdCode});
        const productLogs = await ProductLog.find({householdId : household._id});
        const fields = ['_id', 'productName', 'productBrand', 'productWeight', 'infoProduct', 'numberProduct', 'householdId', 'userId'];
        let arrayProductLogsTransformed = [];
        productLogs.forEach((item)=>{
            const object = {};
            fields.forEach((field)=>{
                object[field] = item[field];
            });
            arrayProductLogsTransformed.push(object);
        });
        return res.json(arrayProductLogsTransformed);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};