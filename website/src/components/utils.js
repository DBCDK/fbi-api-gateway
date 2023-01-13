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
  return dateConverter(timestamp) + " " + timeConverter(timestamp);
}

export function dateConverter(timestamp) {
  var a = new Date(timestamp);
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var time = date + ". " + month + ". " + year + " ";
  return time;
}

export function timeConverter(timestamp) {
  var a = new Date(timestamp);
  var hour = a.getHours() < 10 ? "0" + a.getHours() : a.getHours();
  var min = a.getMinutes() < 10 ? "0" + a.getMinutes() : a.getMinutes();
  var sec = a.getSeconds() < 10 ? "0" + a.getSeconds() : a.getSeconds();
  var time = hour + ":" + min + ":" + sec;
  return time;
}

export function isToken(token) {
  // alpha numeric and more than 32 characters
  return !!token?.match?.(/^(?=.*[a-zA-Z])(?=.*[0-9]).{40}/);
}

export function isEqual(token1, token2) {
  return token1?.token === token2?.token && token1?.profile === token2?.profile;
}
