import { useCallback } from "react";
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

  // Funktion til at hente params fra routerens query
  const getParamsFromRouter = () => ({
    query: router.query.query || "",

    variables: router.query.variables || "",
  });

  // Hent params fra URL'en
  const params = getParamsFromRouter();

  // Synkroniser initialParams på tværs af komponenter med SWR
  const { data: initialParams, mutate: setInitialParams } = useSWR(
    "initial-query-params",
    {
      fallbackData: params,
    }
  );

  // Funktion til manuelt at opdatere initialParams
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
    params, // Aktuelle params fra routerens query
    trimmedParams: trimParams(params), // trimmed aktuelle params fra routerens query
    initialParams, // Initiale params, synkroniseret via SWR
    updateInitialParams, // Funktion til at opdatere initialParams
  };
}
