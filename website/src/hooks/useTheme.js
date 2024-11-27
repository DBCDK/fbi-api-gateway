import { useEffect } from "react";
import getConfig from "next/config";

/**
 * calculates easter day for a given year
 */
function getEasterDay(year) {
  var f = Math.floor,
    // Golden Number - 1
    G = year % 19,
    C = f(year / 100),
    // related to Epact
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    // number of days from 21 March to the Paschal full moon
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    // weekday for the Paschal full moon
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    // number of days from 21 March to the Sunday on or before the Paschal full moon
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);

  // zerofill
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  return `${year}-${month}-${day}`;
}

/**
 * converts easter from day to period
 */
function getEasterPeriod(year, sub = 0, add = 0) {
  const date = getEasterDay(year);
  const UTC = new Date(`${date}T00:00:00Z`);

  // ms pr day
  const ms = 86400000;

  const start = new Date(UTC.getTime() - ms * sub);
  const end = new Date(UTC.getTime() + ms * add);

  return { start: dateConverter(start), end: dateConverter(end) };
}

/**
 * converts timestamps to date
 */
export function dateConverter(timestamp) {
  var a = new Date(timestamp);
  var month = a.getMonth() + 1;
  var day = a.getDate();
  var year = a.getFullYear();

  // zerofill
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  return month + "-" + day + "-" + year;
}

/**
 * Checks if there is an active holiday going on
 */
function getHoliday() {
  const now = new Date().getTime();

  let holiday;
  Object.entries(holidays).forEach(([k, v]) => {
    const start = new Date(v.start).getTime();
    const end = new Date(v.end).getTime();

    if (!holiday) {
      if (now <= end && now >= start) {
        holiday = k;
      }
    }
  });
  return holiday;
}

const year = new Date().getFullYear();
// We define the easter period by 14 days before and 1 day after easterday
const easter = getEasterPeriod(year, 14, 1);

const icons = {
  default: "🥳",
  christmas: "🎅",
  easter: "🐤",
  pride: "🏳️‍🌈",
  halloween: "🎃",
  future: "🔮",
  temp: "👷",
  old: "👴",
};

const holidays = {
  // dynamic holidays
  easter: { start: easter.start, end: easter.end },
  // static holidays
  halloween: { start: `10-01-${year}`, end: `10-31-${year}` },
  christmas: { start: `12-01-${year}`, end: `12-26-${year}` },
};

/**
 *
 * @param {*} value
 */
export default function useTheme() {
  const hasDynamic = getHoliday();
  const hasStatic = getConfig()?.publicRuntimeConfig?.theme || "default";

  // Prioritize the static - but on default - prioritize the dynamic
  const theme = (hasStatic === "default" && hasDynamic) || hasStatic;

  const icon = icons[theme];

  useEffect(() => {
    document.body.classList?.add(theme);
  });

  return {
    theme,
    icon,
  };
}
