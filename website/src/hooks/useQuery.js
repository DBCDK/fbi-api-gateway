import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR from "swr";

// Global state
let locale = { query: "", variables: "" };

// Global hook initialization flag
let initializedKey = null;

// Custom fetcher
const fetcher = () => locale;

const fetchParamsFromRouter = (router) => {
  const { query = "", variables = "" } = router.query;
  return { query, variables };
};

// Function to trim the GraphQL query and variables
const trimParams = (params) => {
  const trimmedQuery = params?.query
    ? params.query.replace(/\s+/g, " ").trim()
    : "";

  let trimmedVariables = "{}";
  if (params?.variables) {
    try {
      trimmedVariables = JSON.stringify(JSON.parse(params.variables), null, 0);
    } catch (error) {
      console.error("Invalid JSON in variables:", error);
      trimmedVariables = "{}"; // Fallback to empty JSON object if parsing fails
    }
  }

  return { query: trimmedQuery, variables: trimmedVariables };
};

export default function useQuery() {
  // initial state of the url
  const [initialParams, setInitialParams] = useState(locale);

  // Router
  const router = useRouter();

  // SWR for managing params state
  const { data, mutate } = useSWR("useQuery", fetcher, {
    fallbackData: locale, // Use fallbackData to ensure SWR has initial values
  });

  useEffect(() => {
    if (router.isReady) {
      const instanceKey = JSON.stringify(router.query);

      if (initializedKey !== instanceKey) {
        const initialParamsFromRouter = fetchParamsFromRouter(router);

        if (locale !== initialParamsFromRouter) {
          // Set global state
          locale = initialParamsFromRouter;

          // Store current url params state
          setInitialParams(locale);

          // Update SWR cache
          mutate(locale, false);

          // Mark as initialized with the current router query
          initializedKey = instanceKey;
        }
      }
    }
  }, [router.isReady, router.query, mutate]);

  // Function to manually update params and update SWR cache
  const updateParams = (newParams = {}) => {
    const { query, variables } = newParams;

    if (query) {
      if (typeof query === "string") {
        locale = { ...locale, query };
      }
    }

    if (variables) {
      if (typeof variables === "string") {
        locale = { ...locale, variables };
      } else {
        locale = { ...locale, variables: JSON.stringify(variables) };
      }
    }

    // Update SWR cache with the new params
    mutate(locale, false);
  };

  // Get trimmed params
  const trimmedParams = trimParams(data);

  return {
    initialParams,
    params: data,
    trimmedParams,
    updateParams,
  };
}
