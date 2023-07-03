import { useEffect } from "react";
import getConfig from "next/config";

const icons = {
  default: "🥳",
  christmas: "🎅",
  easter: "🐤",
  pride: "🏳️‍🌈",
  halloween: "🎃",
};

/**
 *
 * @param {*} value
 */
export default function useTheme() {
  const theme = getConfig()?.publicRuntimeConfig?.theme || "default";
  const icon = icons[theme];

  useEffect(() => {
    document.body.classList?.add(theme);
  });

  return {
    theme,
    icon,
  };
}
