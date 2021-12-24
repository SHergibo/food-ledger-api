const User = require('./../models/user.model'),
      Option = require('./../models/option.model'),
      Household = require('./../models/household.model'),
      Notification = require('./../models/notification.model'),
      Helpers = require('./../helpers/household.helper'),
      Boom = require('@hapi/boom'),
      RefreshToken = require('./../models/refresh-token.model'),
      cryptoRandomString = require('crypto-random-string'),
      FindByQueryHelper = require('./../helpers/findByQueryParams.helper'),
      { socketIoEmit, sendNotifToSocket } = require('./../helpers/socketIo.helper'),
      { transformNeedSwitchAdminToInviteNotif, injectHouseholdName } = require('../helpers/transformNotification.helper');

/**
* Post one user
*/
exports.add = async (req, res, next) => {
  try {
    if(!req.query.householdCode && !req.body.householdName) return next(Boom.badRequest('Need a household name or a household code'));

    let user;
    let arrayOtherMember = [];
    let searchUserArray = [];
    const userCode = cryptoRandomString({length: 10, type: 'url-safe'});
    let household;

    if (req.query.householdCode) {
      household = await Household.findOne({ householdCode: req.query.householdCode });
      if (!household) {
        return next(Boom.badRequest('Pas de famille trouvée avec ce code famille!'));
      }
      if(household.isWaiting){
        return next(Boom.badRequest("Vous ne pouvez pas envoyer une requête d'invitation à cette famille car elle n'a, en ce moment, pas d'administrateur.trice!"));
      }
    }

    if (req.body.othermember) {
      let errorUserCode = [];
      arrayOtherMember = req.body.othermember;
      for (const otherUsercode of arrayOtherMember) {
        const searchUser = await User.findOne({ usercode: otherUsercode });
        let notification;

        if (!searchUser) {
          errorUserCode = [...errorUserCode, {usercode : otherUsercode, errorType : "userCodeNotFound"}];
        }

        if(searchUser){
          notification = await Notification.findOne({
            $and: [
              {userId : searchUser._id },
              {$or : [
                {type: "request-delegate-admin"},
                {type: "last-chance-request-delegate-admin"}
              ]}
            ]
          });
          if(notification){
            errorUserCode = [...errorUserCode, {usercode : otherUsercode, errorType : "userIsWaiting"}];
          }
        }

        if(searchUser && !notification){
          searchUserArray = [...searchUserArray, searchUser._id];
        }
      }
      if(errorUserCode.length >= 1 ){
        searchUserArray = [];
        return next(Boom.notFound('Il y a un ou plusieurs problèmes avec certains de vos codes utilisateurs', errorUserCode));
      }
    }

    if (req.body.householdName || req.query.householdCode) {
      req.body.usercode = userCode;
      if(req.query.householdCode){
        req.body.householdId = null;
        req.body.role = "user";
      }

      if(req.body.householdName) req.body.role = "admin";
      
      user = new User(req.body);
      await user.save();
      let option = new Option({userId : user._id});
      await option.save();
      user = await User.findByIdAndUpdate(user._id, { optionId: option._id });
    }

    if (req.body.householdName) {
      let newHousehold = await Helpers.addHousehold({
        householdName: req.body.householdName,
        userId: user._id
      });
      user = await User.findByIdAndUpdate(user._id, { householdId: newHousehold._id });


      if (req.body.othermember) {
        for (const otherUserId of searchUserArray) {
          let notification = await new Notification({
            message: `L'administrateur.trice de la famille {householdName} vous invite à rejoindre sa famille. Acceptez-vous l'invitation?`,
            householdId: newHousehold._id,
            userId: otherUserId,
            type: "invitation-household-to-user",
            urlRequest: "add-user-respond"
          });
          await notification.save();

          notification = await Notification.findById(notification._id)
          .populate({
            path: 'householdId',
            select: 'householdName -_id'
          });

          socketIoEmit(otherUserId, [{name : "updateNotificationReceived", data: injectHouseholdName(notification.transform({withHouseholdId: true}))}]);
          await sendNotifToSocket({userId : otherUserId, notificationId : notification._id, type : "received", addedNotif: true});
        }
        searchUserArray = [];
      }


    } else if (req.query.householdCode) {

      let notification = await new Notification({
        message: `L'utilisateur.trice ${user.firstname} ${user.lastname} veut rejoindre votre famille. Acceptez-vous la demande?`,
        senderUserId : user._id,
        householdId: household._id,
        type: "invitation-user-to-household",
        urlRequest: "add-user-respond"
      });
      await notification.save();
      socketIoEmit(household.userId, [{name : "updateNotificationReceived", data: notification.transform()}]);
      await sendNotifToSocket({userId : household.userId, notificationId : notification._id, type : "received", addedNotif: true});
    }

    return res.json(user.transform());
  } catch (error) {
    next({error: error, boom: User.checkDuplicateEmail(error)});
  }
};

/**
* GET user List with pagination
*/
exports.findPaginate = async (req, res, next) => {
  try {
    let finalObject = await FindByQueryHelper.finalObjectUserList({pageIndex : req.query.page, findByData : req.params.householdId, model : User});
    const household = await Household.findById(req.params.householdId);

    const members = household.members;

    members.forEach(member => {
      finalObject.arrayData = finalObject.arrayData.map(element => {
        if(element._id.toString() === member.userData.toString()){
          return {...element, isFlagged : member.isFlagged}
        }else{
          return element;
        }
      });
    });

    const adminIndex = finalObject.arrayData.findIndex(element => element._id.toString() === household.userId.toString());

    if(adminIndex !== 0){
      const member = finalObject.arrayData[adminIndex];
      finalObject.arrayData.splice(adminIndex, 1);
      finalObject.arrayData.splice(0, 0, member);
    }

    return res.json(finalObject);
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
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
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};

/**
* PATCH user
*/
exports.update = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, req.body);
    return res.json(user.transform());
  } catch (error) {
    next({error: error, boom: User.checkDuplicateEmail(error)});
  }
};

/**
* DELETE user
*/
exports.remove = async (req, res, next) => {
  try {
    const queryUserId = req.query.delegateUserId;
    const user = await User.findById(req.params.userId);
    const household = await Household.findById(user.householdId);

    if(household){
      let arrayMembers = household.members;
      let indexUserToDelete = arrayMembers.findIndex(member => member.userData.toString() === user._id.toString());
      arrayMembers.splice(indexUserToDelete, 1);
  
      if (user.role === "admin") {
        if (!queryUserId) {
          await Helpers.noMoreAdmin(arrayMembers, household._id);
        } else if (queryUserId) {
          let requestSwitchAdmin = await Helpers.requestSwitchAdmin(user._id, queryUserId);
          if (requestSwitchAdmin) {
            return next(requestSwitchAdmin);
          }
        }
      } else if (user.role === "user") {
        household = await Household.findByIdAndUpdate(household._id, { members: arrayMembers });

        socketIoEmit(household.userId, [{name : "updateFamilly", data: household.transform()}]);

        if(household.members.length === 1){
          await transformNeedSwitchAdminToInviteNotif({userId : household.userId, SocketIoHelper : {socketIoEmit, sendNotifToSocket}});
        }
  
        let olderHousehold = await Household.findOne({ userId: user._id });
        if (olderHousehold) {
          await Helpers.removeHousehold(olderHousehold._id);
        }
      }
    }

    let notifToDelete = await Notification.find({$or : 
      [
        { userId: user._id },
        { senderUserId : user._id },
      ]
    });

    if(notifToDelete.length >= 1){
      for (const notif of notifToDelete) {
        let notifHousehold = await Household.findById(notif.householdId);
        if(notif.userId){
          await sendNotifToSocket({userId : notifHousehold.userId, notificationId : notif._id, type : "sended"});
        }else if (notif.senderUserId){
          socketIoEmit(notifHousehold.userId, [{name : "deleteNotificationReceived", data: notif._id}]);
          await sendNotifToSocket({userId : notifHousehold.userId, notificationId : notif._id, type : "received"});
        }
        await Notification.findByIdAndDelete(notif._id);
      }
    }

    await RefreshToken.findOneAndDelete({
      userId: user._id,
      userEmail : user.email
    });

    await User.findByIdAndDelete(user._id);
    await Option.findByIdAndDelete(user.optionId);
    return res.json(user.transform());
  } catch (error) {
    next({error: error, boom: Boom.badImplementation(error.message)});
  }
};