import useSwr from "swr";
import useAccessToken from "./useAccessToken";
import config from "@/config";

export default function useData(params) {
  const { accessToken } = useAccessToken();
  const res = useSwr(
    params?.query && accessToken && JSON.stringify({ params, accessToken }),
    async () => {
      const res = await fetch(config.fbiApiUrl, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: params.query,
          variables: params.variables,
        }),
      });

      const json = await res.json();
      return json;
    }
  );
  return { ...res, data: res?.data?.data };
}
