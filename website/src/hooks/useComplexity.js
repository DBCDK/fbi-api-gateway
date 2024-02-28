import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

// parse function - parse string variables to json
function parseVariables(variables) {
  // return if already object
  if (typeof variables === "object") {
    return variables;
  }

  // Parse string variables to json
  try {
    return JSON.parse(variables);
  } catch (e) {
    //  allow empty variables (if none set)
    if (variables === "") {
      return {};
    }
    // variables is not valid json
    else {
      return null;
    }
  }
}

// Fetcher
const fetcher = async (url, { token, query, variables }) => {
  const parsedVariables = parseVariables(variables);

  // variables is not valid json
  if (!parsedVariables) {
    return {};
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: parsedVariables,
    }),
  });

  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useComplexity({ token, query, variables }) {
  const url = `/complexity`;
  const isValid = isToken(token);
  const params = { token, query, variables };

  const { data, error } = useSWR(
    [url, params],
    (url, params) => fetcher(url, params),
    {
      fallback: {},
    }
  );

  return (
    {
      complexity: data?.complexity,
      limit: 2500,
      isLoading: !data && !error && isValid,
    } || {}
  );
}
