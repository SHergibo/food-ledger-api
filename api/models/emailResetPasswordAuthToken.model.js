const Mongoose = require("mongoose"),
  Crypto = require("crypto"),
  Moment = require("moment-timezone"),
  { UrlEmail } = require("../../config/environment.config"),
  { sendGridEmail } = require("../helpers/sendGrid-mail.helper");

let Schema = Mongoose.Schema;

let schema = new Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    ref: "User",
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
});

schema.statics.generate = async function (user) {
  const tokenObject = new emailResetPasswordAuthToken();
  tokenObject.token = `${Crypto.randomBytes(40).toString("hex")}`;
  tokenObject.userId = user._id;
  tokenObject.userEmail = user.email;
  tokenObject.expires = Moment().add(10, "minutes").toDate();
  await tokenObject.save();

  const dynamic_template_data = {
    subject: "Requête changement de mot de passe !",
    title: "Requête changement de mot de passe !",
    text: `Cliquez sur le lien ci-dessous pour pouvoir changer votre mot de passe. Si vous n'avez pas fait cette demande de changement de mot de passe, ne partagez pas et ne cliquez pas sur lien ci-dessous !`,
    url: `${UrlEmail}/reset-password/${tokenObject.token}`,
    urlText: "Changer votre mot de passe !",
  };

  await sendGridEmail({
    to: user.email,
    dynamic_template_data,
  });
};

const emailResetPasswordAuthToken = Mongoose.model(
  "EmailResetPasswordAuthToken",
  schema
);

module.exports = emailResetPasswordAuthToken;
