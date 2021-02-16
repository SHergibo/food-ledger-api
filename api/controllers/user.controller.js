const User = require('./../models/user.model'),
      Option = require('./../models/option.model'),
      Household = require('./../models/household.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      TokenAuth = require('./../models/token-auth.model'),
      cryptoRandomString = require('crypto-random-string'),
      { socketIoNotification } = require('./../helpers/socketIo.helper');

/**
* Post one user
*/
exports.add = async (req, res, next) => {
  try {
    let user;
    let arrayOtherMember;
    let searchUserArray = [];
    const userCode = cryptoRandomString({length: 10, type: 'url-safe'});
    let household;

    if (req.query.householdCode) {
      household = await Household.findOne({ householdCode: req.query.householdCode });
      if (!household) {
        return next(Boom.badRequest('No familly found with this household code'));
      }
    }

    if (req.body.othermember) {
      let wrongUserCode = [];
      arrayOtherMember = req.body.othermember;
      for (const otherUsercode of arrayOtherMember) {
        const searchUser = await User.findOne({ usercode: otherUsercode });
        if (!searchUser) {
          wrongUserCode.push(otherUsercode);
        }
        searchUserArray.push(searchUser);
      }
      if(wrongUserCode.length >= 1){
        searchUserArray = [];
        return next(Boom.notFound(`There is one or more invalid usercode.`, wrongUserCode));
      }
    }

    if (req.body.householdName || req.query.householdCode) {
      req.body.usercode = userCode;
      if(req.query.householdCode){
        req.body.householdCode = "none";
      }
      user = new User(req.body);
      await user.save();
      let option = new Option({userId : user._id});
      await option.save();
      user = await User.findByIdAndUpdate(user._id, { optionId: option._id }, { override: true, upsert: true, new: true });
    }
    //Si création d'un utilisateur en même temps qu'un ménage
    if (req.body.householdName) {
      let newHousehold = await Helpers.addHousehold({
        householdName: req.body.householdName,
        user: user
      });
      user = await User.findByIdAndUpdate(user._id, { householdCode: newHousehold.householdCode }, { override: true, upsert: true, new: true });


      if (req.body.othermember) {
        //Si création d'un user avec autre usercode
        for (const otherUser of searchUserArray) {
          //New notif pour otherMember
          let notification = await new Notification({
            message: `L'administrateur de la famille ${newHousehold.householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
            householdId: newHousehold._id,
            userId: otherUser._id,
            senderUserId : user._id,
            type: "invitation-household-to-user",
            urlRequest: "add-user-respond"
          });
          await notification.save();
          socketIoNotification(otherUser._id, "notifSocketIo", notification);
        }
        searchUserArray = [];
      }


      //Si création d'un utilisateur avec un code famille
    } else if (req.query.householdCode) {

      //Envoie notif à l'admin de la famille en question
      let notification = await new Notification({
        message: `L'utilisateur ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`,
        fullName: `${user.firstname} ${user.lastname}`,
        senderUserCode: user.usercode,
        senderUserId : user._id,
        householdId: household._id,
        userId: household.userId,
        otherUserId: user._id,
        type: "invitation-user-to-household",
        urlRequest: "add-user-respond"
      });
      await notification.save();
      socketIoNotification(household.userId, "notifSocketIo", notification);
    } else {
      return next(Boom.badRequest('Need a household name or a household code'));
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
      household = await Household.findOne({ householdCode: user.householdCode });
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
          return next(Boom.badRequest(requestSwitchAdmin.message));
        }
      }
    } else if (user.role === "user") {
      await Household.findByIdAndUpdate(household._id, { member: arrayMember }, { override: true, upsert: true, new: true });

      let olderHousehold = await Household.findOne({ userId: user._id });
      if (olderHousehold) {
        await Helpers.removeHousehold(olderHousehold._id);
      }
    }

    //delete toutes les notifications de l'utilisateur à delete
    let notifToDelete = await Notification.find({userId : user._id});

    if(notifToDelete.length >= 1){
      for (const notif of notifToDelete) {
        await Notification.findByIdAndDelete(notif._id);
      }
    }

    await User.findByIdAndDelete(paramsUserId);
    await Option.findByIdAndDelete(user.optionId);
    return res.json(user.transform());
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};