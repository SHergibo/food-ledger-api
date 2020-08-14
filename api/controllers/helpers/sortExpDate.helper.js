const Moment = require('moment');
 
const splitDate = (date) => {
  let splitDate = date.split('/');
  let momentDate = Moment(`${splitDate[1]}-${splitDate[0]}-${splitDate[2]}`, "MM-DD-YYYY")
  let newDate = Moment(momentDate).format();
  return newDate;
};

exports.sortExpDate = async (body) => {
  let arrayExpDateSorted = await body.expirationDate.sort((a, b) => {
    let expDateB = new Date(splitDate(b.expDate));
    let expDateA = new Date(splitDate(a.expDate));
    return expDateA - expDateB;
  });
  arrayExpDateSorted.forEach(element => {
    element.expDate = splitDate(element.expDate);
  });
  body.expirationDate = arrayExpDateSorted;
  return body;
};