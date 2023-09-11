import { useEffect } from "react";
import useMode from "@/hooks/useMode";
import getConfig from "next/config";
import useLocalStorage from "./useLocalStorage";

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
  const { mode, setMode, hasEnforcedMode } = useMode();
  const theme = getConfig()?.publicRuntimeConfig?.theme || "default";
  const icon = icons[theme];

  useEffect(() => {
    if (theme === "halloween" && mode === "theme") {
      setMode("theme");
    }
  }, []);

  useEffect(() => {
    document.body.classList?.add(theme);
  });

  return {
    theme,
    icon,
  };
}
