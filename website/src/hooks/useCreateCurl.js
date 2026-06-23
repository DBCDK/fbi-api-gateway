import { useState, useEffect } from "react";
import { useGraphQLUrl } from "./useSchema";
import useEffectiveSelectedCredential from "./credentials/useEffectiveSelectedCredential";

export function useCreateCurl({ token, query, variables }) {
  const [curl, setCurl] = useState(null);

  const { effectiveToken } = useEffectiveSelectedCredential();
  const url = useGraphQLUrl();

  useEffect(() => {
    const generateCurl = () => {
      if (!url) {
        return null;
      }

      const curl_vars = variables?.replace?.(/\s+/g, " ") || "{}";
      const curl_query = JSON.stringify(query?.replace(/\s+/g, " ")) || "";

      const _token = token || effectiveToken;

      return `curl -H "Authorization: bearer ${_token}" -H "Content-Type: application/json" -X POST -d '{"query": ${curl_query}, "variables": ${curl_vars}}' ${url}`;
    };

    setCurl(generateCurl());
  }, [effectiveToken, query, token, url, variables]);

  return curl;
}
