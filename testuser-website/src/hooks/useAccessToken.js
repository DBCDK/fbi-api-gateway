import { useEffect, useMemo } from "react";
import useSWR from "swr";
import config from "@/config";
import { useRouter } from "next/router";
const SEED_STORAGE_KEY = "testUserSeed";
let seed = "";
export default function useAccessToken() {
  const router = useRouter();
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

  return {
    accessToken: `test_${router.query.agency || router.query.idp}_${seed}:${
      config.anonymousToken.access_token
    }`,
    seed: data,
    setSeed,
  };
}
