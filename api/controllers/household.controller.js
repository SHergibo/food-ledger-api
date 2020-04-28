const Household = require('./../models/household.model'),
      Helpers = require('./helpers/household.helper');
      Boom = require('@hapi/boom');

/**
* Post one household
*/
exports.add = async (req, res, next) => {
    try {
        const household = await Helpers.addHousehold(req.body);
        return res.json(household);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};

/**
* GET one household
*/
exports.findOne = async (req, res, next) => {
    try {
        const household = await Household.findById(req.params.householdId);
        return res.json(household);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};

/**
* PATCH household
*/
exports.update = async (req, res, next) => {
    try {
        const household = await Household.findByIdAndUpdate(req.params.householdId, req.body, { override: true, upsert: true, new: true });
        return res.json(household);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};

/**
* DELETE household
*/
exports.remove = async (req, res, next) => {
    try {
        const household = await Household.findByIdAndDelete(req.params.householdId);
        return res.json(household);
    } catch (error) {
        next(Boom.badImplementation(error.message));
    }
};