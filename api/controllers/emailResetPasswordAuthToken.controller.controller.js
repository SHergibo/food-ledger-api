const EmailResetPasswordAuthToken = require("../models/emailResetPasswordAuthToken.model"),
  Boom = require("@hapi/boom"),
  User = require("../models/user.model"),
  Moment = require("moment-timezone");

/**
 * POST create new email reset password auth token
 */
exports.createEmailResetPasswordAuthToken = async (req, res, next) => {
  try {
    let oldResetAuthToken = await EmailResetPasswordAuthToken.findOne({
      userEmail: req.body.email,
    });

    if (oldResetAuthToken) {
      if (oldResetAuthToken.expires < Moment().toDate()) {
        await EmailResetPasswordAuthToken.findByIdAndDelete(
          oldResetAuthToken.id
        );
      } else {
        return next(
          Boom.unauthorized(
            "Vous avez déjà fait une demande il y a peu, veuillez attendre quelques minutes !"
          )
        );
      }
    }

    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(Boom.notFound("Cette adresse mail n'existe pas !"));
    }
    if (user.role === "ghost") {
      return next(
        Boom.unauthorized(
          "Veuillez authentifier votre compte avant de faire une demande de changement de mot de passe !"
        )
      );
    }

    await EmailResetPasswordAuthToken.generate(user);

    return res.status(204).send();
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};

/**
 * PATCH user password
 */
exports.resetUserPassword = async (req, res, next) => {
  try {
    let findTokenAuth = await EmailResetPasswordAuthToken.findOne({
      token: req.params.tokenId,
    });
    if (!findTokenAuth) {
      return next(Boom.notFound("Ce token de vérification n'existe pas !"));
    }
    if (findTokenAuth.expires < Moment().toDate()) {
      return next(Boom.unauthorized("Ce token de vérification a expiré !"));
    } else {
      let token = await EmailResetPasswordAuthToken.findOneAndDelete({
        token: req.params.tokenId,
      });

      let user = await User.findById(token.userId);
      user.password = req.body.password;
      await user.save();

      return res.status(204).send();
    }
  } catch (error) {
    next(Boom.badImplementation(error.message));
  }
};
