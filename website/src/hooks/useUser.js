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

  return res.user;
};

export default function useUser(props) {
  const url = `/api/user?token=${props?.token}&profile=${props?.profile}`;
  const isValid = isToken(props?.token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });

  return { user: data, isLoading: !data && !error && isValid } || {};
}
