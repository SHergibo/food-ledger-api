const User = require('./../models/user.model'),
      Helpers = require('./helpers/household.helper');
      Boom = require('@hapi/boom'),
      TokenAuth = require('./../models/token-auth.model');

const generateUserCode = (username) =>{
    return `${username}-2020` //TODO générer aleatoirement
}

/**
* Post one user
*/
exports.add = async (req, res, next) =>{
    // console.log(req.body);
    try{
        let user;
        const userCode = generateUserCode(`${req.body.firstname}${req.body.lastname}`);

        if(req.body.householdcode){
            //find le ménage avec le code si ok => on continu sinon return error et stop la création de l'utilisateur
        }

        if(req.body.householdname || req.body.householdcode){
            req.body.usercode = userCode;
            user = new User(req.body);
            await user.save();
        }
        //Si création d'un utilisateur en même temps qu'un ménage
        if(req.body.householdname){
            const household = await Helpers.addHousehold({
                householdname : req.body.householdname,
                usercode : userCode,
                userId : user._id
            })
            user = await User.findByIdAndUpdate(user._id,  {householdcode : household.householdcode}, {override : true, upsert : true, new : true});
        //Si création d'un utilisateur avec un code famille
        }else if(req.body.householdcode){
            //TODO test si householdcode existe
            await Helpers.patchMemberHousehold({
                householdcode : req.body.householdcode,
                usercode : userCode
            })
        }else{
            //message erreur besoin d'un nom de famille ou d'un code famille
        }
        
        await TokenAuth.generate(user);
        return res.json(user.transform());
    }catch(error){
        console.log(error);
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