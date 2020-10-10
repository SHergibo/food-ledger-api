const Household = require('../../models/household.model'),
      User = require('../../models/user.model'),
      Notification = require('../../models/notification.model'),
      ProductLog = require('../../models/product-log.model'),
      Product = require('../../models/product.model'),
      Historic = require('../../models/historic.model'),
      Brand = require('../../models/brand.model'),
      cryptoRandomString = require('crypto-random-string'),
      Moment = require('moment-timezone');

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
};

exports.requestSwitchAdmin = async (userId, query) => {
    let delegate = await User.findOne({ usercode: query });
    let oldAdmin = await User.findById(userId);
    let household = await Household.findOne({ userId });
    if (!delegate) {
        return { status: 400, message: "Invalid usercode" };
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
            message: "Vous avez été désigné(e) comme nouvel administrateur de cette famille par l'ancien administrateur, acceptez-vous cette requête ou passez l'administration à un autre membre de votre famille. Attention si vous êtes le/la dernier(ère) membre éligible de cette famille, la famille sera supprimée et ne pourra pas être récupérée",
            householdId: household._id,
            userId: delegate._id,
            type: "request-admin",
            urlRequest : "switch-admin",
            expirationDate: Moment().add({h: 23, m: 59, s: 59}).toDate()
        });
        await notification.save();
        return household;
    }
};

exports.noMoreAdmin = async (arrayMember, householdId) => {
    for (const otherUser of arrayMember) {
        let olderHousehold = await Household.findOne({ userId: otherUser.userId });
        //Check si le membre était admin d'une ancienne famille et le replace dans cette famille
        if (olderHousehold) {

            if(otherUser.isFlagged === true){
                otherUser.isFlagged = false;
            }
            
            await User.findByIdAndUpdate(otherUser.userId, {role : "admin", householdCode: olderHousehold.householdCode }, { override: true, upsert: true, new: true });
            let addMember = olderHousehold.member;
            addMember.push(otherUser);
            await Household.findByIdAndUpdate(olderHousehold._id, { member: addMember }, { override: true, upsert: true, new: true });
        }
        //Si le membre n'avait pas d'ancienn famille, ajout de "none" dans householdCode, cette personne devra obligatoirement créer une famille lors de sa prochaine connection"
        else {
            await User.findByIdAndUpdate(otherUser.userId, { householdCode: "none" }, { override: true, upsert: true, new: true });
        }

        //Delete notification de type last-chance-request-admin
        await Notification.findOneAndDelete({userId : otherUser.userId, type: "last-chance-request-admin" });
    }

    return await removeHousehold(householdId);
};

exports.removeHousehold = async (householdId) => {
    await Product.deleteMany({householdId : householdId});
    await Historic.deleteMany({householdId : householdId});
    await ProductLog.deleteMany({householdId : householdId});
    await Brand.deleteMany({householdId : householdId});
    return await Household.findByIdAndDelete(householdId);
};