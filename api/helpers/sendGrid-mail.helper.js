const {
    SendGridAPIKey,
    SendGridFrom,
    SendGridListTemplateId,
    SendGridBaseTemplateId,
  } = require("../../config/environment.config"),
  sgMail = require("@sendgrid/mail");

sgMail.setApiKey(SendGridAPIKey);

exports.sendGridEmail = async ({
  to,
  templateType = "base",
  dynamic_template_data,
}) => {
  try {
    const msg = {
      to,
      from: SendGridFrom,
      templateId:
        templateType === "list"
          ? SendGridListTemplateId
          : SendGridBaseTemplateId,
      dynamic_template_data,
    };
    await sgMail.send(msg);
    return;
  } catch (error) {
    return error;
  }
};
