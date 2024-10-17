import { useState, useEffect } from "react";

// curlParser function that uses regex to parse the cURL command
const parseCurl = (curlCommand) => {
  const result = {
    url: "",
    method: "GET", // Default HTTP method
    headers: {},
    data: null,
    profile: null,
    token: null,
  };

  if (!isValidCurlCommand(curlCommand)) {
    return result;
  }

  // Regex patterns for matching different parts of the curl command
  const methodPattern = /(-X|--request)\s+([A-Z]+)/;
  const headerPattern = /(-H|--header)\s+"([^"]+)"/g;
  const dataPattern = /(-d|--data|--data-raw|--data-binary)\s+'([^']+)'/;
  const urlPattern = /(http[^\s]+)/;
  const profilePattern = /(?<=\/)[^\/]+(?=\/graphql)/;
  const tokenPattern = /(?<=Authorization:\s?bearer\s)[A-Za-z0-9]+/;

  // Match the HTTP method
  const methodMatch = curlCommand?.match?.(methodPattern);
  if (methodMatch) {
    result.method = methodMatch[2];
  }

  // Match the headers (iterative match since there can be multiple headers)
  let headerMatch;
  while ((headerMatch = headerPattern.exec(curlCommand)) !== null) {
    const [key, value] = headerMatch[2].split(": ");
    result.headers[key] = value;
  }

  // Match the data (supporting multiple --data formats)
  const dataMatch = curlCommand?.match?.(dataPattern);
  if (dataMatch) {
    try {
      // Parse the JSON data, replacing single quotes inside the data with double quotes
      result.data = JSON.parse(dataMatch[2].replace(/'/g, '"'));
    } catch (error) {
      result.data = dataMatch[2]; // If parsing fails, return the raw string
    }
  }

  // Match the URL
  const urlMatch = curlCommand?.match?.(urlPattern);
  if (urlMatch) {
    result.url = urlMatch[1];
  }

  // Match the Profile
  const profileMatch = curlCommand?.match?.(profilePattern);

  if (profileMatch) {
    result.profile = profileMatch[0];
  }

  // Match the Token
  const tokenMatch = curlCommand?.match?.(tokenPattern);
  if (tokenMatch) {
    result.token = tokenMatch[0];
  }

  return result;
};

const validateParsedCurl = (json) => {
  return !json?.data?.query;
};

function isValidCurlCommand(curlCommand) {
  // Trim leading and trailing whitespace
  const trimmedCommand = curlCommand.trim();

  // Basic validation checks for common curl components
  const hasCurl = trimmedCommand.startsWith("curl ");
  const hasUrl = /https?:\/\/[^\s]+/.test(trimmedCommand);
  const hasValidFlags = /(-X\s+(GET|POST|PUT|DELETE)|-H\s+['"]?.+['"]?|-d\s+['"]?.+['"]?)/.test(
    trimmedCommand
  );

  return hasCurl && hasUrl && hasValidFlags;
}

// Custom React Hook for parsing cURL commands
const useParseCurl = (curlCommand) => {
  const [parsedResult, setParsedResult] = useState(null);

  useEffect(() => {
    if (curlCommand) {
      const parsedData = parseCurl(curlCommand);
      setParsedResult(parsedData);
    }
  }, [curlCommand]);

  const hasError = validateParsedCurl(parsedResult);

  return { json: parsedResult, isValidCurlCommand, hasError };
};

export default useParseCurl;
