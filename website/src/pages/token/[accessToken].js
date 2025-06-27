import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useStorage from "@/hooks/useStorage";
import { Spinner } from "react-bootstrap";

export default function TokenPage() {
  const router = useRouter();
  const { accessToken } = router.query;
  const { getHistoryItem, setSelectedToken } = useStorage();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (typeof accessToken === "string") {
      // If token is already owned we set token with the profile already used
      const item = getHistoryItem(accessToken);
      setSelectedToken(accessToken, item?.profile);
      router.replace("/documentation");
    }
  }, [isClient, accessToken, setSelectedToken, router]);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
      }}
    >
      <Spinner />
      <div
        style={{
          marginTop: "var(--pt1)",
        }}
      >
        Fetching documentation
      </div>
    </div>
  );
}
