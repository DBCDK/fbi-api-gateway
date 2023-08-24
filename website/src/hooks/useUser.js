import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });

  if (response.status !== 200) {
    return {};
  }

  const res = await response.json();

  return res.data?.user;
};

export default function useUser({ token, profile }) {
  const url = `/api/user?token=${token}&profile=${profile}`;
  const isValid = isToken(token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });

  return { user: data, isLoading: !data && !error && isValid } || {};
}
