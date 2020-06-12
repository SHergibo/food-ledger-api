const User = require('./../models/user.model'),
  Household = require('./../models/household.model'),
  Helpers = require('./helpers/household.helper');
Boom = require('@hapi/boom'),
  TokenAuth = require('./../models/token-auth.model');

const generateUserCode = (username) => {
  return `${username}-2020` //TODO générer aleatoirement
}

/**
* Post one user
*/
exports.add = async (req, res, next) => {
  // console.log(req.body);
  try {
    let user;
    let arrayOtherMember;
    let searchUserArray = [];
    const userCode = generateUserCode(`${req.body.firstname}${req.body.lastname}`);

    if (req.body.householdcode) {
      const household = await Household.findOne({ householdcode: req.body.householdcode });
      if (!household) {
        //TODO provisoire
        return res.status(404).send({ error: "No familly found with this household code" });
      }
    }

    if (req.body.othermember) {
      arrayOtherMember = req.body.othermember;
      for (const otherUsercode of arrayOtherMember) {
        const searchUser = await User.findOne({ usercode: otherUsercode });
        if (!searchUser) {
          //TODO provisoire (envoyer plus d'information pour utilisation dans le front, tableau du ou des mauvais usercodes ???)
          searchUserArray = [];
          return res.status(404).send({ error: `No user with this usercode ${otherUsercode}` });
        }
        searchUserArray.push(searchUser);

        //Supprime le membre de la liste membre de son ancienne famille
        const householdOtherUser = await Household.findOne({ userId: searchUser._id });
        let arrayMember = householdOtherUser.member;
        let indexMember = arrayMember.findIndex(obj => obj.usercode === otherUsercode);
        if (indexMember > -1) {
          arrayMember.splice(indexMember, 1);
          await Household.findByIdAndUpdate(householdOtherUser._id, { member: arrayMember }, { override: true, upsert: true, new: true });
        }
      }
    }

    if (req.body.householdname || req.body.householdcode) {
      req.body.usercode = userCode;
      user = new User(req.body);
      await user.save();
    }
    //Si création d'un utilisateur en même temps qu'un ménage
    if (req.body.householdname) {
      let household = await Helpers.addHousehold({
        householdname: req.body.householdname,
        user: user
      });
      user = await User.findByIdAndUpdate(user._id, { householdcode: household.householdcode }, { override: true, upsert: true, new: true });
      if (req.body.othermember) {
        //Si création d'un user avec autre usercode
        for (const otherUser of searchUserArray) {
          searchUser = await User.findByIdAndUpdate(otherUser._id, { householdcode: household.householdcode }, { override: true, upsert: true, new: true });
          let newMember = household.member;
          let objectMember = await Helpers.createObjectMember(searchUser);
          newMember.push(objectMember);
          household = await Household.findByIdAndUpdate(household._id, { member: newMember }, { override: true, upsert: true, new: true });
        }
        searchUserArray = [];
      }
      //Si création d'un utilisateur avec un code famille
    } else if (req.body.householdcode) {
      await Helpers.patchMemberHousehold({
        householdcode: req.body.householdcode,
        usercode: userCode
      })
    } else {
      //TODO provisoire
      return res.status(400).send({ error: "Need a household name or a household code" });
    }

    await TokenAuth.generate(user);
    return res.json(user.transform());
  } catch (error) {
    console.log(error);
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
    let paramsUserId = req.params.userId;
    let queryUserCode = req.query.delegateUserCode;
    const user = await User.findById(paramsUserId);
    let household;

    if (user.role === "admin") {
      household = await Household.findOne({ userId: paramsUserId });
    } else if (user.role === "user") {
      household = await Household.findOne({ householdcode: user.householdcode });
    }

    let arrayMember = household.member;
    let indexUserToDelete = arrayMember.findIndex(obj => obj.usercode === user.usercode);
    arrayMember.splice(indexUserToDelete, 1);

    //Delete si pas de délégation de famille à un autre membre de la même famille
    if (user.role === "admin") {
      if (!queryUserCode) {
        //Boucle dans le tableau des membres de la famille sans l'utilisateur voulant supprimmer son compte
        for (const otherUser of arrayMember) {
          let olderHousehold = await Household.findOne({ userId: otherUser.userId });
          //Check si le membre était admin d'une ancienne famille et le replace dans cette famille
          if (olderHousehold) {
            await User.findByIdAndUpdate(otherUser.userId, { householdcode: olderHousehold.householdcode }, { override: true, upsert: true, new: true });
            let addMember = olderHousehold.member;
            addMember.push(otherUser);
            await Household.findByIdAndUpdate(olderHousehold._id, { member: addMember }, { override: true, upsert: true, new: true });
          }
          //Si le membre n'avait pas d'ancienn famille, ajout de "none" dans householdcode, cette personne devra obligatoirement créer une famille lors de sa prochaine connection"
          else {
            await User.findByIdAndUpdate(otherUser.userId, { householdcode: "none" }, { override: true, upsert: true, new: true });
          }
        }
        await Household.findByIdAndDelete(household._id);
      } else if (queryUserCode) {
        let requestSwitchAdmin = await Helpers.requestSwitchAdmin(paramsUserId, queryUserCode);
        if (requestSwitchAdmin.status) {
          //TODO provisoire
          return res.status(requestSwitchAdmin.status).send(requestSwitchAdmin.message);
        }
      }
    } else if (user.role === "user") {
      //TODO ne pas oublier de changer le role d'un membre d'admin en user lors d'un changement de famille (dans la route request)
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