import fetch from "isomorphic-unfetch";
import useSWR from "swr";

export default function useUsage(token, args = {}) {
  const fetcher = async () => {
    const response = await fetch("/api/elastic", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token?.token}`,
      },
      body: JSON.stringify({
        q: args?.q,
        options: args?.options,
        profile: token?.profile,
      }),
    });

    if (response.status !== 200) {
      new Error("An error occurred while fetching the data.");
      return {};
    }

    return await response.json();
  };

  const { data, error } = useSWR(
    token?.token && ["/api/smaug", args],
    fetcher,
    {
      // revalidateIfStale: false,
    }
  );

  return {
    isUsed: data?.hasMatch,
    uuid: data?.uuid,
    timestamp: data?.timestamp,
    stringQuery: data?.parsedQuery,
    operationName: data?.opeartionName,
    profile: data?.profile,
    agencyId: data?.agencyId,
    isLoading: !data && !error,
    error,
  };
}
