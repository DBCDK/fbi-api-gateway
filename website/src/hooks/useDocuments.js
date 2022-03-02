import fetch from "isomorphic-unfetch";
import useSWR from "swr";

const fetcher = async (url) => {
  const response = await fetch(url, {
    method: "GET",
  });
  if (response.status !== 200) {
    return {};
  }
  return await response.json();
};

export default function useDocuments(token) {
  const url = "/api/mdxloader";

  const { data } = useSWR(url, fetcher);

  return {
    docs: data?.docs || [],
    isLoading: !data,
  };
}
