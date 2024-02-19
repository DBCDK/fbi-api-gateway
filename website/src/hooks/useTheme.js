import { useEffect } from "react";
import useMode from "@/hooks/useMode";
import getConfig from "next/config";

const icons = {
  default: "🥳",
  christmas: "🎅",
  easter: "🐤",
  pride: "🏳️‍🌈",
  halloween: "🎃",
};

function getEaster(year) {
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

  // cerofill
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  return `${year}-${month}-${day}`;
}

function isItEaster(year) {
  const date = getEaster(year);
  const UTC = new Date(`${date}T00:00:00Z`);

  console.log("### UTC", UTC);

  const ms = 86400000;

  // UTC - 14;

  const start = new Date(UTC.getTime() - ms * 14);
  const end = new Date(UTC.getTime() + ms);

  console.log("%%%", year, dateConverter(start), " - ", dateConverter(end));

  return date;
}

export function dateConverter(timestamp) {
  var a = new Date(timestamp);
  var month = a.getMonth() + 1;
  var day = a.getDate();

  // cerofill
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  var time = day + "/" + month;
  return time;
}

console.log(
  "easter...",
  dateConverter(isItEaster(2020)),
  dateConverter(isItEaster(2021)),
  dateConverter(isItEaster(2022)),
  dateConverter(isItEaster(2023)),
  dateConverter(isItEaster(2024)),
  dateConverter(isItEaster(2025)),
  dateConverter(isItEaster(2026)),
  dateConverter(isItEaster(2027)),
  dateConverter(isItEaster(2028)),
  dateConverter(isItEaster(2029)),
  dateConverter(isItEaster(2030))
);

/**
 *
 * @param {*} value
 */
export default function useTheme() {
  // const { mode, setMode } = useMode();
  const theme = getConfig()?.publicRuntimeConfig?.theme || "default";
  const icon = icons[theme];

  // if (theme === "halloween" && mode === "theme") {
  //   setMode("theme");
  // }

  useEffect(() => {
    document.body.classList?.add(theme);
  });

  return {
    theme,
    icon,
  };
}
