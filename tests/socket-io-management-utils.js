module.exports.connectSocketClient = async (objectClientSocket) => {
  for (let clientSocket in objectClientSocket) {
    objectClientSocket[clientSocket].on("connect", () => {return true});
  }
};

module.exports.disconnectSocketClient = async (objectClientSocket) => {
  for (let clientSocket in objectClientSocket) {
    objectClientSocket[clientSocket].close();
  }
};