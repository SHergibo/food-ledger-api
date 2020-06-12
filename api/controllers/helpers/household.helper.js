const Household = require('../../models/household.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');

createObjectMemberNoExport = async (body) => {
    let objectMember = {
        userId : body._id,
        usercode: body.usercode,
        firstname : body.firstname,
        lastname : body.lastname,
        isFlaged : false,
    };
    return objectMember;
};

exports.createObjectMember = async (body) => {
    return await createObjectMemberNoExport(body);
};

exports.addHousehold = async (body) => {
    const householdcode = `${body.householdname}-2020` //TODO générer aléatoirement
    let objectMember = await createObjectMemberNoExport(body.user);
    const household = new Household({
        member: [objectMember],
        householdname: body.householdname,
        userId: body.user._id,
        householdcode: householdcode
    });
    await household.save();
    return household;
};

exports.patchMemberHousehold = async (body) => {
    let household = await Household.findOne({ householdcode: body.householdcode });
    let user = await User.findOne({usercode : body.usercode});
    let objectMember = await createObjectMemberNoExport(user);
    let members = household.member;
    members.push(objectMember);
    const householdPatchedMembers = await Household.findByIdAndUpdate(household._id, { member: members }, { override: true, upsert: true, new: true });
    return householdPatchedMembers;
};

exports.requestSwitchAdmin = async (userId, query) => {
    let delegate = await User.findOne({ usercode: query });
    let oldAdmin = await User.findById(userId);
    let household = await Household.findOne({ userId });
    if (!delegate) {
        //TODO provisoire
        return { status: 400, message: { error: "Invalid usercode" } };
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
            type: "request-admin"
        });
        await notification.save();
        return household;
    }
};