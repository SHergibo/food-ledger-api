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

exports.addHousehold = async (body) => {
  try {
    const householdCode = cryptoRandomString({length: 10, type: 'url-safe'});
    let newHousehold = new Household({
        members: [
          {userData : body.userId, isFlagged: false}
        ],
        householdName: body.householdName,
        userId: body.userId,
        householdCode: householdCode
    });
    newHousehold = await newHousehold.save()
    const household = await newHousehold.populate({
      path: 'members.userData',
      select: 'firstname lastname usercode role'
    })
    .execPopulate();
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
        let arrayMembers = household.members;
        let indexMember = arrayMembers.findIndex(member => member.userData.toString() === oldAdmin._id.toString());
        if (indexMember > -1) {
            arrayMembers.splice(indexMember, 1);
        }
        household = await Household.findByIdAndUpdate(household._id, { isWaiting: true, members: arrayMembers }, { override: true, upsert: true, new: true })
        .populate({
          path: 'members.userData',
          select: 'firstname lastname usercode role'
        });

        let notification = await new Notification({
            message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'ancien.ne administrateur.trice, acceptez-vous cette requête ou passez l'administration à un.e autre membre de votre famille. Attention si vous êtes le/la dernier.ère membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée!",
            householdId: household._id,
            userId: delegate._id,
            type: "request-delegate-admin",
            urlRequest : "delegate-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
        });
        await notification.save();

        socketIoEmit(delegate._id, [{name : "updateNotificationReceived", data: notification.transform()}]);

        for (const member of household.members){
          socketIoEmit(member.userData, [{name : "updateFamilly", data: household}]);
        }

        return;
    }
  } catch (error) {
    return error;
  }
};

exports.noMoreAdmin = async (arrayMembers, householdId) => {
  try {
    for (const member of arrayMembers) {
      let householdData = {};
      let userData;
      let oldHousehold = await Household.findOne({ userId: member.userData });
      if (oldHousehold) {

          if(member.isFlagged === true){
              member.isFlagged = false;
          }
          
          userData = await User.findByIdAndUpdate(member.userData, {role : "admin", householdId: oldHousehold._id }, { override: true, upsert: true, new: true });
          let addMember = oldHousehold.members;
          addMember.push(member);
          householdData = await Household.findByIdAndUpdate(oldHousehold._id, { members: addMember }, { override: true, upsert: true, new: true })
          .populate({
            path: 'members.userData',
            select: 'firstname lastname usercode role'
          });
      }
      else {
        userData = await User.findByIdAndUpdate(member.userData, { householdId: null }, { override: true, upsert: true, new: true });
      }

      let deletedNotification = await Notification.findOneAndDelete({userId : member.userData, type: "last-chance-request-delegate-admin" });

      let arraySocketIo = [{ name : "updateUserAndFamillyData", data: { userData : userData, householdData : householdData } }];

      if(deletedNotification){
        arraySocketIo.push({ name : "deleteNotificationReceived", data: deletedNotification._id })
      }

      socketIoEmit(member.userData, arraySocketIo);
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

    let notifications = await Notification.find({householdId : householdId});
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