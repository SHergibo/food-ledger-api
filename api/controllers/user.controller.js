const User = require('./../models/user.model'),
      Household = require('./../models/household.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./helpers/household.helper'),
      Boom = require('@hapi/boom'),
      TokenAuth = require('./../models/token-auth.model');

const generateUserCode = (username) => {
  return `${username}-2020` //TODO générer aleatoirement
}

/**
* Post one user
*/
exports.add = async (req, res, next) => {
  try {
    let user;
    let arrayOtherMember;
    let searchUserArray = [];
    const userCode = generateUserCode(`${req.body.firstname}${req.body.lastname}`);
    let household;

    if (req.query.householdcode) {
      household = await Household.findOne({ householdcode: req.query.householdcode });
      if (!household) {
        throw Boom.notFound('No familly found with this household code');
      }
    }

    if (req.body.othermember) {
      arrayOtherMember = req.body.othermember;
      for (const otherUsercode of arrayOtherMember) {
        const searchUser = await User.findOne({ usercode: otherUsercode });
        if (!searchUser) {
          //TODO provisoire (envoyer plus d'information pour utilisation dans le front, tableau du ou des mauvais usercodes ???)
          searchUserArray = [];
          throw Boom.notFound(`No user with this usercode ${otherUsercode}`);
        }
        searchUserArray.push(searchUser);
      }
    }

    if (req.body.householdname || req.query.householdcode) {
      req.body.usercode = userCode;
      if(req.query.householdcode){
        req.body.householdcode = "none";
      }
      user = new User(req.body);
      await user.save();
    }
    //Si création d'un utilisateur en même temps qu'un ménage
    if (req.body.householdname) {
      let newHousehold = await Helpers.addHousehold({
        householdname: req.body.householdname,
        user: user
      });
      user = await User.findByIdAndUpdate(user._id, { householdcode: newHousehold.householdcode }, { override: true, upsert: true, new: true });


      if (req.body.othermember) {
        //Si création d'un user avec autre usercode
        for (const otherUser of searchUserArray) {
          //New notif pour otherMember
          let notification = await new Notification({
            message: `L'administrateur de la famille ${newHousehold.householdname} vous invite a rejoindre sa famille. Acceptez-vous l'invitation?`,
            householdId: newHousehold._id,
            userId: otherUser._id,
            type: "request-addUser",
            urlRequest: "add-user-respond"
          });
          await notification.save();
        }
        searchUserArray = [];
      }


      //Si création d'un utilisateur avec un code famille
    } else if (req.query.householdcode) {

      //Envoie notif à l'admin de la famille en question
      let notification = await new Notification({
        message: `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`,
        householdId: household._id,
        userId: household.userId,
        otherUserId: user._id,
        type: "request-addUser",
        urlRequest: "add-user-respond"
      });
      await notification.save();
    } else {
      throw Boom.badRequest('Need a household name or a household code');
    }

    await TokenAuth.generate(user);
    return res.json(user.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
* GET one user
*/
exports.findOne = async (req, res, next) => {
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
    const user = await User.findByIdAndUpdate(req.params.userId, req.body, { override: true, upsert: true, new: true });
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

    //TODO check l'id de l'utilisateur à supprimer avec l'id livrer par l'accessToken pour bloquer une personne ayant l'id d'une autre personne

    let paramsUserId = req.params.userId;
    let queryUserCode = req.query.delegateUserCode;
    const user = await User.findById(paramsUserId);
    let household;

    if (user.role === "admin") {
      household = await Household.findOne({ userId: paramsUserId });
    } else if (user.role === "user") {
      household = await Household.findOne({ householdcode: user.householdcode });
    }

    //met à jour le tableau des membres d'une famille sans la personne qui va supprimer son compte
    let arrayMember = household.member;
    let indexUserToDelete = arrayMember.findIndex(obj => obj.usercode === user.usercode);
    arrayMember.splice(indexUserToDelete, 1);

    //Delete si pas de délégation de famille à un autre membre de la même famille
    if (user.role === "admin") {
      if (!queryUserCode) {
        await Helpers.noMoreAdmin(arrayMember, household._id);
      } else if (queryUserCode) {
        let requestSwitchAdmin = await Helpers.requestSwitchAdmin(paramsUserId, queryUserCode);
        if (requestSwitchAdmin.status) {
          throw Boom.badRequest(requestSwitchAdmin.message);
        }
      }
    } else if (user.role === "user") {
      await Household.findByIdAndUpdate(household._id, { member: arrayMember }, { override: true, upsert: true, new: true });

      let olderHousehold = await Household.findOne({ userId: user._id });
      if (olderHousehold) {
        await Household.findByIdAndDelete(olderHousehold._id);
      }
    }


    await User.findByIdAndDelete(paramsUserId);
    return res.json(user.transform());
  } catch (error) {
    console.log(error);
    next(Boom.badImplementation(error.message));
  }
};