import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Spinner } from "react-bootstrap";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";

export default function TokenPage() {
  const router = useRouter();
  const { accessToken } = router.query;
  const { resolveCredentialValue } = useCredentialMutations();

  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState("");
  const handledToken = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof accessToken !== "string") return;

    if (handledToken.current === accessToken) {
      return;
    }

    handledToken.current = accessToken;

    async function resolveAndRedirect() {
      const response = await resolveCredentialValue({ value: accessToken });

      if (!response?.safeEntry?.token) {
        setError(response?.message || "The access token could not be resolved.");
        return;
      }

      await router.replace("/documentation");
    }

    resolveAndRedirect().catch(() => {
      setError("The access token could not be resolved.");
    });
  }, [isClient, accessToken, resolveCredentialValue, router]);

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
      {!error && <Spinner />}
      <div
        style={{
          marginTop: "var(--pt1)",
        }}
      >
        {error || "Fetching documentation"}
      </div>
    </div>
  );
}
