/**
 * useGraphQLRequests hook
 *
 * A custom React hook for capturing and managing GraphQL requests observed via Chrome DevTools.
 * Supports real-time tracking, filtering based on a search term, and clearing of request history.
 * Falls back to mocked data when running outside Chrome DevTools.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import mockData from "@/mocked.json";
export interface ServiceCall {
  request: {
    url: string;
    options?: { method?: string };
    timings?: { total?: number };
  };
  response: {
    status: number;
    body?: unknown;
  };
}

export interface RequestData {
  operationName: string;
  variables: Record<string, unknown>;
  query: string;
  serviceCalls: ServiceCall[];
  responseJson: Record<string, unknown>;
  status: string;
  time: string;
}

export function useGraphQLRequests({ filter }: { filter?: string } = {}) {
  const [, refresh] = useState({});
  const requestsRef = useRef<RequestData[]>([]);

  useEffect(() => {
    function extractOperationName(query: string) {
      const match = query.match(/\b(query|mutation|subscription)\s+(\w+)/);
      return match ? match[2] : "(unnamed)";
    }

    function handleRequest(request: chrome.devtools.network.Request) {
      if (
        request.request.method === "POST" &&
        request.request.url.includes("/graphql")
      ) {
        const requestBody = request.request.postData?.text;

        request.getContent((responseBody) => {
          try {
            const requestJson = JSON.parse(requestBody || "{}");
            const responseJson = JSON.parse(responseBody || "{}");

            if (requestJson.query && responseJson.extensions?.debug) {
              const operationName = extractOperationName(requestJson.query);
              const status = request.response.status.toString();
              const time = new Date().toLocaleTimeString();
              const variables = requestJson.variables || {};
              const query = requestJson.query;
              const serviceCalls = responseJson.extensions.debug.requests || [];

              requestsRef.current = [
                ...requestsRef.current,
                {
                  operationName,
                  variables,
                  query,
                  serviceCalls,
                  responseJson,
                  status,
                  time,
                },
              ];

              refresh({});
            }
          } catch (e) {
            console.error("Failed to parse GraphQL request or response", e);
          }
        });
      }
    }

    if (chrome?.devtools?.network?.onRequestFinished) {
      chrome.devtools.network.onRequestFinished.addListener(handleRequest);

      return () => {
        chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
      };
    } else {
      console.log("Running in dev mode: loading mocked data");
      requestsRef.current = mockData as RequestData[];
      refresh({});
    }
  }, []);

  function clearRequests() {
    requestsRef.current = [];
    refresh({});
  }

  const filtered = useMemo(() => {
    if (!filter) {
      return requestsRef.current;
    }
    return requestsRef.current.filter((req) => {
      const query = req.query || "";
      const vars = JSON.stringify(req.variables || {});
      const response = JSON.stringify(req.responseJson || {});
      return `${query} ${vars} ${response}`
        .toLowerCase()
        .includes(filter?.toLowerCase());
    });
  }, [filter, requestsRef.current]);

  return {
    requests: filtered,
    clearRequests,
  };
}
