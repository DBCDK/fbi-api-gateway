import useSWR from "swr";

const KEY_NAME = "graphiql:disable-internal-network-check";

const ENUM_VALUES = {
  enabled: "enabled",
  disabled: "disabled",
};

export default function useInternalNetworkCheck() {
  const { data: internalNetworkCheck = "enabled", mutate } = useSWR(
    KEY_NAME,
    (key) => localStorage.getItem(key) || "enabled"
  );

  function setInternalNetworkCheck(value) {
    if (ENUM_VALUES[value]) {
      localStorage.setItem(KEY_NAME, value);
      mutate(value);
    }
  }

  return {
    internalNetworkCheck,
    disableInternalNetworkCheck: internalNetworkCheck === "disabled",
    setInternalNetworkCheck,
  };
}
