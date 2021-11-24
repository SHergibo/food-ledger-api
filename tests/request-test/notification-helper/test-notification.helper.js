module.exports.testNotification = async (objectClientSocket, testByEmitName) => {
  let allNotif = {};

  for await (const emitNameByClientSocket of testByEmitName) {
    for (const key in emitNameByClientSocket) {
      for await (const emitName of emitNameByClientSocket[key]) {
        let notif;
        await objectClientSocket[key].on(emitName, (data) => {
          notif = data;
        });
        allNotif[Object.keys(emitNameByClientSocket)[0]] = {emitName : notif}
      }
    }
  }
  console.log(allNotif)
  return allNotif;
};