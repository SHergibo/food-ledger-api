exports.transformDate = (date) => {
  date = new Date(date)
  let day = date.getDate();
  if (day <= 9) {
    day = `0${day}`;
  }
  let month = date.getMonth() + 1;
  if (month <= 9) {
    month = `0${month}`;
  }
  return `${day}/${month}/${date.getFullYear()}`;
};