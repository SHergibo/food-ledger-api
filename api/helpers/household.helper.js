const Household = require('./../models/household.model'),
      User = require('./../models/user.model'),
      Notification = require('./../models/notification.model'),
      ProductLog = require('./../models/product-log.model'),
      ShoppingList = require('./../models/shopping-list.model'),
      Product = require('./../models/product.model'),
      Historic = require('./../models/historic.model'),
      Brand = require('./../models/brand.model'),
      cryptoRandomString = require('crypto-random-string'),
      Moment = require('moment-timezone'),
      { socketIoEmit } = require('./../helpers/socketIo.helper');

createObjectMemberNoExport = async (body) => {
    let objectMember = {
        userId: body._id,
        usercode: body.usercode,
        firstname: body.firstname,
        lastname: body.lastname,
        isFlagged: false,
    };
    return objectMember;
};

exports.createObjectMember = async (body) => {
    return await createObjectMemberNoExport(body);
};

exports.addHousehold = async (body) => {
  try {
    const householdCode = cryptoRandomString({length: 10, type: 'url-safe'});
    let objectMember = await createObjectMemberNoExport(body.user);
    const household = new Household({
        member: [objectMember],
        householdName: body.householdName,
        userId: body.user._id,
        householdCode: householdCode
    });
    await household.save();
    return household;
  } catch (error) {
    return error;
  }
};

exports.requestSwitchAdmin = async (userId, query) => {
  try {
    let delegate = await User.findById(query);
    let oldAdmin = await User.findById(userId);
    let household = await Household.findOne({ userId });
    if (!delegate) {
        return { status: 400, message: "Invalid userId!" };
    } else {
        //Supprimer l'ancien admin de la liste des membres et mais isWaiting en true pour bloquer toutes éditions/suppressions/ajour de produit dans la famille
        let arrayMember = household.member;
        let indexMember = arrayMember.findIndex(obj => obj.usercode === oldAdmin.usercode);
        if (indexMember > -1) {
            arrayMember.splice(indexMember, 1);
        }
        household = await Household.findByIdAndUpdate(household._id, { isWaiting: true, member: arrayMember }, { override: true, upsert: true, new: true });

        //Créer la notification pour que le membre désigné comme nouvel admin, accepte ou non la requête.
        let notification = await new Notification({
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée !",
            householdId: household._id,
            userId: delegate._id,
            type: "request-delegate-admin",
            urlRequest : "delegate-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
        });
        await notification.save();

        socketIoEmit(delegate._id, [{name : "updateNotificationReceived", data: notification.transform()}]);

        for (const otherUser of household.member){
          socketIoEmit(otherUser.userId, [{name : "updateFamilly", data: household}]);
        }

        return;
    }
  } catch (error) {
    return error;
  }
};

exports.noMoreAdmin = async (arrayMember, householdId) => {
  try {
    for (const otherUser of arrayMember) {
      let householdData = {};
      let userData;
      let oldHousehold = await Household.findOne({ userId: otherUser.userId });
      //Check si le membre était admin d'une ancienne famille et le replace dans cette famille
      if (oldHousehold) {

          if(otherUser.isFlagged === true){
              otherUser.isFlagged = false;
          }
          
          userData = await User.findByIdAndUpdate(otherUser.userId, {role : "admin", householdCode: oldHousehold.householdCode }, { override: true, upsert: true, new: true });
          let addMember = oldHousehold.member;
          addMember.push(otherUser);
          householdData = await Household.findByIdAndUpdate(oldHousehold._id, { member: addMember }, { override: true, upsert: true, new: true });
      }
      //Si le membre n'avait pas d'ancienn famille, ajout de "none" dans householdCode, cette personne devra obligatoirement créer une famille lors de sa prochaine connection"
      else {
        userData = await User.findByIdAndUpdate(otherUser.userId, { householdCode: "none" }, { override: true, upsert: true, new: true });
      }

      //Delete notification de type last-chance-request-delegate-admin
      let deletedNotification = await Notification.findOneAndDelete({userId : otherUser.userId, type: "last-chance-request-delegate-admin" });

      let arraySocketIo = [{ name : "updateUserAndFamillyData", data: { userData : userData, householdData : householdData } }];

      if(deletedNotification){
        arraySocketIo.push({ name : "deleteNotificationReceived", data: deletedNotification._id })
      }

      socketIoEmit(otherUser.userId, arraySocketIo);
    }
    await removeHousehold(householdId);
    return;
  } catch (error) {
    return error;
  }
};

let removeHousehold = async (householdId) => {
  try {
    await Product.deleteMany({householdId : householdId});
    await Historic.deleteMany({householdId : householdId});
    await ProductLog.deleteMany({householdId : householdId});
    await ShoppingList.deleteMany({householdId : householdId});
    await Brand.deleteMany({householdId : householdId});

    let notifications = await Notifcation.find({householdId : householdId});
    for (const notif of notifications) {
      let idUser = notif.userId;
      if(notif.type === "invitation-user-to-household"){
        idUser = notif.senderUserId;
        data = [{ name : "deleteNotificationSended", data: notif._id }];
      }else{
        data = [{ name : "deleteNotificationReceived", data: notif._id }];
      }
      socketIoEmit(idUser, data);
      await Notification.findByIdAndDelete(notif._id);
    }

    await Household.findByIdAndDelete(householdId);
    return;
  } catch (error) {
    return error;
  }
};

exports.removeHousehold = removeHousehold;