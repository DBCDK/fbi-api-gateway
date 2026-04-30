import fetch from "isomorphic-unfetch";
import useSWR from "swr";

import { isToken } from "@/components/utils";
import useConfiguration from "./useConfiguration";

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
  const { configuration } = useConfiguration(props);
  const profile = props?.profile ?? configuration?.profiles?.[0] ?? null;
  const url = `/api/user?token=${props?.token}&profile=${profile}`;
  const isValid = isToken(props?.token);

  const { data, error } = useSWR(isValid && url, fetcher, {
    fallback: {},
  });

  return { user: data, isLoading: !data && !error && isValid } || {};
}
