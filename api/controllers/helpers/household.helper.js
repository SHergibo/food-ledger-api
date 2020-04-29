const Household = require('../../models/household.model');

exports.addHousehold = async (body) => {
    const householdcode = `${body.householdname}-2020` //TODO générer aléatoirement
    const household = new Household({
        member: [body.usercode], //TODO provisoire
        householdname: body.householdname,
        userId: body.userId,
        householdcode: householdcode
    });
    await household.save();
    return household;
};

exports.patchMemberHousehold = async (body) => {
    let household = await Household.findOne({householdcode : body.householdcode});
    let members = household.member;
    members.push(body.usercode);
    const householdPatchedMembers = await Household.findByIdAndUpdate(household._id, {member : members}, { override: true, upsert: true, new: true });
    return householdPatchedMembers;
};