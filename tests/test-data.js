module.exports.adminOneDataComplete = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'johndoe@test.com',
  password: '123456789',
  role : 'admin',
  householdName: "Familly-Doe"
};

module.exports.adminTwoDataComplete = {
  firstname: 'David',
  lastname: 'Doe',
  email: 'daviddoe@test.com',
  password: '123456789',
  role : 'admin',
  householdName: "Familly-DavidDoe"
};

module.exports.userTwoDataComplete = {
  firstname: 'Sabine',
  lastname: 'Doe',
  email: 'sabinedoe@test.com',
  password: '123456789',
  role : 'user',
};

module.exports.userThreeDataComplete = {
  firstname: 'Jules',
  lastname: 'Doe',
  email: 'julesjoe@test.com',
  password: '123456789',
  role : 'user',
  householdName: "Familly-JulesDoe"
};

module.exports.userFourDataComplete = {
  firstname: 'Gaelle',
  lastname: 'Doe',
  email: 'gaelleDoe@test.com',
  password: '123456789',
  role : 'user',
};

module.exports.userDataMissing = {
  firstname: 'John',
  lastname: 'Doe',
  email: 'johndoe@test.com',
  password: '123456789',
  role : 'admin'
};

module.exports.notificationAddUserRespond = {
  message: "Bonne notification test",
  householdId: "606dad080ac1c22766b37a53",
  userId: "606dad080ac1c22766b37a53",
  type: "need-switch-admin",
  urlRequest: "add-user-respond"
}

module.exports.notificationDelegateAdmin = {
  message: "Mauvaise notification test",
  householdId: "606dad080ac1c22766b37a53",
  userId: "606dad080ac1c22766b37a53",
  type: "need-switch-admin",
  urlRequest: "delegate-admin"
};

module.exports.notificationRequestAdmin = {
  message: "Vous avez été désigné.e comme nouvel.le administrateur.trice de cette famille par l'administrateur.trice actuel.le, acceptez-vous cette requête?",
  householdId: "606dad080ac1c22766b37a53",
  userId: "606dad080ac1c22766b37a53",
  senderUserId: "606dad080ac1c22766b37a53",
  type: "request-admin",
  urlRequest: "switch-admin-rights-respond",
};
