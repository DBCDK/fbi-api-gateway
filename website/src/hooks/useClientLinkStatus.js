import useSWR from "swr";
import { useRouter } from "next/router";

export default function useClientLinkStatus() {
  const router = useRouter();
  const { data: completedPath, mutate: setCompletedPath } = useSWR(
    "client-link:completed-path",
    null,
    { fallbackData: null },
  );

  return {
    isLoading: Boolean(
      router.isReady && typeof router.query.clientId === "string" &&
      router.query.clientId && completedPath !== router.asPath
    ),
    setCompletedPath,
  };
}
