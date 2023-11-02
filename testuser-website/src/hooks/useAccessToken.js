import { useEffect, useMemo } from "react";
import useSWR from "swr";
import config from "@/config";
const SEED_STORAGE_KEY = "testUserSeed";
let seed = "";
export default function useAccessToken() {
  const { data, mutate: mutateSeed } = useSWR("seed", () => seed);

  function setSeed(val) {
    localStorage.setItem(SEED_STORAGE_KEY, val);
    seed = val;
    mutateSeed(val);
  }
  useEffect(() => {
    const testUserSeed = localStorage.getItem(SEED_STORAGE_KEY);
    if (testUserSeed) {
      setSeed(testUserSeed);
    }
  }, []);

  const res = useMemo(() => {
    if (!seed) {
      return {};
    }
    const params = new URLSearchParams(document.location.search);
    const anonToken = config.anonAccessToken;
    return {
      accessToken: `test_${
        params.get("agency") || params.get("idp")
      }_${seed}:${anonToken}`,
      params,
      csrfToken: config.csrfToken,
    };
  }, [seed]);

  return {
    ...res,
    seed: data,
    setSeed,
  };
}
