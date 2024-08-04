import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { useGraphQLUrl } from "./useSchema";

export default function useUsage(token, args = {}) {
  const url = useGraphQLUrl();

  const fetcher = async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${token?.token}`,
      },
      body: JSON.stringify({
        query: `query ($options: UsageOptionsInput) {
                  insights {
                    usage(options: $options) {
                      hasMatch
                      parsedQuery
                      opeartionName
                      profile
                      agencyId
                      timestamp
                      debug {
                        totalMs
                        didTimeout
                      }
                    }
                  }
                }`,
        variables: {
          options: {
            ...args,
          },
        },
      }),
    });

    if (response.status !== 200) {
      return {};
    }

    const res = await response.json();
    return res.data.insights.usage;
  };

  const { data, error } = useSWR(token?.token && [url, args], fetcher, {
    // revalidateIfStale: false,
  });

  return {
    isUsed: data?.hasMatch,
    timestamp: data?.timestamp,
    stringQuery: data?.parsedQuery,
    operationName: data?.opeartionName,
    profile: data?.profile,
    agencyId: data?.agencyId,
    isLoading: !data && !error,
  };
}
