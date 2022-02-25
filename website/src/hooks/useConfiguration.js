import fetch from "isomorphic-unfetch";
import useSWR from "swr";

const isToken = (token) => {
  // alpha numeric and more than 32 characters
  return !!(token && token.match(/^(?=.*[a-zA-Z])(?=.*[0-9]).{40}/));
};

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });
  if (response.status !== 200) {
    return {};
  }

  return await response.json();
};

export default function useConfiguration(token) {
  const url = `/api/smaug?token=${token}`;

  const { data, error } = useSWR(isToken(token) && url, fetcher);

  return { configuration: data, isLoading: !data && !error } || {};
}
