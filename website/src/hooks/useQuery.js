import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";

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
  const router = useRouter();

  // Function to get params from the router's query
  const getParamsFromRouter = () => ({
    query: router.query.query || "",
    variables: router.query.variables || "",
  });

  // Fetch params from URL
  const params = getParamsFromRouter();

  // Synchronize initialParams across components with SWR
  const { data: initialParams, mutate: setInitialParams } = useSWR(
    "initial-query-params",
    {
      fallbackData: params,
    }
  );

  // useRef to track if initialParams has been set once
  const hasSetInitialParams = useRef(false);

  // Set initialParams only on the first render
  useEffect(() => {
    if (!hasSetInitialParams.current) {
      setInitialParams(params);
      hasSetInitialParams.current = true;
    }
  }, [params, setInitialParams]);

  // Function to manually update initialParams
  const updateInitialParams = useCallback(
    (newInitialParams) => {
      setInitialParams((prevParams) => {
        const updatedQuery =
          typeof newInitialParams.query === "string"
            ? newInitialParams.query
            : prevParams.query;

        const updatedVariables =
          newInitialParams.variables != null
            ? typeof newInitialParams.variables === "string"
              ? newInitialParams.variables
              : JSON.stringify(newInitialParams.variables)
            : prevParams.variables;

        return {
          query: updatedQuery,
          variables: updatedVariables,
        };
      });
    },
    [setInitialParams]
  );

  return {
    params, // Current params from router's query
    trimmedParams: trimParams(params), // Trimmed current params from router's query
    initialParams, // Initial params, synchronized via SWR
    updateInitialParams, // Function to update initialParams
  };
}
