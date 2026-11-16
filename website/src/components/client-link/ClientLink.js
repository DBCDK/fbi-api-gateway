import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Form, Container, Spinner } from "react-bootstrap";
import useCredentialResolve from "@/hooks/credentials/useCredentialResolve";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";
import { getCredentialRequestHeaders } from "@/utils/credentialSettings";
import { getAvailableAgencies } from "@/utils/configuration";
import Environments from "@/components/top/environments";

export default function ClientLink({ children }) {
  const router = useRouter();
  const clientId = typeof router.query.clientId === "string" ? router.query.clientId : "";
  // Remount the connection flow when navigating to a different explicit client.
  if (clientId) {
    return router.isReady ? <Connection key={router.asPath} clientId={clientId} /> : null;
  }
  return children;
}

function Connection({ clientId }) {
  const router = useRouter();
  const { resolveCredential } = useCredentialResolve();
  const { persistResolvedEntry, clearSelectedCredential } = useCredentialMutations();
  const started = useRef(false);
  const mounted = useRef(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [needsSecret, setNeedsSecret] = useState(false);
  const [secret, setSecret] = useState("");
  const [notice, setNotice] = useState("");
  const [destination, setDestination] = useState(null);

  async function connect(clientSecret) {
    setBusy(true);
    setError("");
    try {
      const response = await resolveCredential({ value: clientId, clientSecret });
      if (!mounted.current) return;
      const entry = response?.safeEntry;
      if (!entry?.token) {
        setNeedsSecret(response?.status === "CLIENT_SECRET_REQUIRED");
        throw new Error(response?.message || "Could not connect this client.");
      }
      const params = new URLSearchParams({ entryId: entry.id });
      const loadConfiguration = async () => {
        const result = await fetch(`/api/credentials/configuration?${params}`, {
          headers: getCredentialRequestHeaders(),
        });
        if (!result.ok) throw new Error("Could not load the client configuration.");
        const configuration = await result.json();
        if (configuration.status && configuration.status !== "OK") {
          throw new Error("Could not load the client configuration.");
        }
        return configuration;
      };
      let configuration = await loadConfiguration();
      const agencies = getAvailableAgencies(configuration);
      const requestedAgency = router.query.agency;
      const defaultAgency = configuration.defaultAgency || configuration.agency;
      const agency = agencies.includes(requestedAgency) ? requestedAgency :
        agencies.includes(defaultAgency) ? defaultAgency : agencies[0] || null;
      if (agency) {
        params.set("agency", agency);
        configuration = await loadConfiguration();
      }
      if (!mounted.current) return;
      const requestedProfile = router.query.profile;
      const profiles = configuration.profiles || [];
      const profile = profiles.includes(requestedProfile) ? requestedProfile : profiles[0] || null;
      const changes = [];
      if (requestedAgency && agency !== requestedAgency) changes.push(`Agency changed to ${agency || "none"}.`);
      if (requestedProfile && profile !== requestedProfile) changes.push(`Profile changed to ${profile || "none"}.`);
      persistResolvedEntry({ ...entry, agency, profile }, { select: true });
      setSecret("");
      const url = new URL(window.location.href);
      ["clientId", "agency", "profile"].forEach((key) => url.searchParams.delete(key));
      const next = url.pathname + url.search + url.hash;
      if (changes.length) {
        setNotice(changes.join(" "));
        setDestination(next);
      } else {
        await router.replace(next, undefined, { scroll: false });
      }
    } catch (err) {
      setError(err.message || "Could not connect this client.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    if (started.current) return () => { mounted.current = false; };
    started.current = true;
    clearSelectedCredential();
    connect();
    return () => { mounted.current = false; };
  }, []);

  return (
    <Container className="py-4">
      <Environments />
      <h1>Connect application</h1>
      <p>{clientId}</p>
      {busy && <><Spinner size="sm" /> Connecting…</>}
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      {notice && <Alert variant="info">{notice}</Alert>}
      {destination ? <Button onClick={() => router.replace(destination, undefined, { scroll: false })}>Continue</Button> :
        !busy && <Form onSubmit={(event) => { event.preventDefault(); connect(secret || undefined); }}>
          {needsSecret && <Form.Group className="mb-3" controlId="client-link-secret">
            <Form.Label>Client secret</Form.Label>
            <Form.Control type="password" autoComplete="off" value={secret} onChange={(event) => setSecret(event.target.value)} required />
          </Form.Group>}
          <Button type="submit">{needsSecret ? "Connect" : "Try again"}</Button>
        </Form>}
    </Container>
  );
}
