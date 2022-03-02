var months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function dateTimeConverter(timestamp) {
  var a = new Date(timestamp);
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours() < 10 ? "0" + a.getHours() : a.getHours();
  var min = a.getMinutes() < 10 ? "0" + a.getMinutes() : a.getMinutes();
  var sec = a.getSeconds() < 10 ? "0" + a.getSeconds() : a.getSeconds();
  var time =
    date + ". " + month + ". " + year + " " + hour + ":" + min + ":" + sec;
  return time;
}

export function isToken(token) {
  // alpha numeric and more than 32 characters
  return !!(token && token.match(/^(?=.*[a-zA-Z])(?=.*[0-9]).{40}/));
}
