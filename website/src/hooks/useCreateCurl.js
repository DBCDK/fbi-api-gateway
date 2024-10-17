import { useState, useEffect } from "react";
import useStorage from "./useStorage";
import { useGraphQLUrl } from "./useSchema";

export function useCreateCurl({ token, query, variables }) {
  const [curl, setCurl] = useState(null);

  const { selectedToken } = useStorage();
  const url = useGraphQLUrl();

  useEffect(() => {
    const generateCurl = () => {
      const curl_vars = variables?.replace?.(/\s+/g, " ") || "{}";
      const curl_query = JSON.stringify(query?.replace(/\s+/g, " ")) || "";

      const _token = token || selectedToken?.token;

      return `curl -H "Authorization: bearer ${_token}" -H "Content-Type: application/json" -X POST -d '{"query": ${curl_query}, "variables": ${curl_vars}}' ${url}`;
    };

    setCurl(generateCurl());
  }, [url, selectedToken, query, variables]);

  return curl;
}
