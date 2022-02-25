import useSWR from "swr";

export default function useStorage() {
  const { data: history, mutate: mutateHistory } = useSWR("history", (key) =>
    JSON.parse(localStorage.getItem(key) || "[]")
  );

  const {
    data: selectedToken,
    mutate: mutateSelectedToken,
  } = useSWR("selectedToken", (key) => sessionStorage.getItem(key));

  const setSelectedToken = (token) => {
    sessionStorage.setItem("selectedToken", token);
    mutateSelectedToken(token, false);
  };

  /**
   * Clear token from sessionStorage
   *
   */
  const removeSelectedToken = () => {
    sessionStorage.removeItem("selectedToken");
    mutateSelectedToken(null, false);
  };

  const setHistory = (token) => {
    const timestamp = Date.now();
    const history = history();
    // remove duplicate
    const uniq = history.filter((obj) => !(obj.token === token));
    // add to beginning of array
    uniq.unshift({
      token,
      timestamp,
    });
    // slice
    const sliced = uniq.slice(0, 10);
    // store
    const stringified = JSON.stringify(sliced);
    localStorage.setItem("history", stringified);
    // mutate
    mutateHistory(sliced, false);
  };

  return {
    history,
    selectedToken,
    setHistory,
    setSelectedToken,
    removeSelectedToken,
  };
}
