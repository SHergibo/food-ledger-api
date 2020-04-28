const User = require('./../models/user.model'),
      Boom = require('@hapi/boom'),
      TokenAuth = require('./../models/token-auth.model');

/**
* Post one user
*/
exports.add = async (req, res, next) =>{
    try{
        const user = new User(req.body);
        await user.save();
        await TokenAuth.generate(user);
        return res.json(user.transform());
    }catch(error){
        next(User.checkDuplicateEmail(error));
    }
};

/**
* GET one user
*/
exports.findOne = async (req, res, next) =>{
    try {
        const user = await User.findById(req.params.userId);
        return res.json(user.transform());
    } catch (error) {
        next(Boom.badImplementation(error.message));        
    }
};

/**
* PATCH user
*/
exports.update = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.userId,  req.body, {override : true, upsert : true, new : true});
        return res.json(user.transform());
    } catch (error) {
        next(User.checkDuplicateEmail(err)); 
    }
};

/**
* DELETE user
*/
exports.remove = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);
        return res.json(user.transform());
    } catch (error) {
        next(Boom.badImplementation(error.message));        
    }
};