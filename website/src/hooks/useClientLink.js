import useClientLinkStatus from "./useClientLinkStatus";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useCredentialResolve from "@/hooks/credentials/useCredentialResolve";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";

export default function useClientLink() {
  const router = useRouter();
  const { setCompletedPath } = useClientLinkStatus();
  const clientId = typeof router.query.clientId === "string" ? router.query.clientId : "";
  const { applications, hasFetchedApplications } = useCredentialEntries();
  const { resolveCredential } = useCredentialResolve();
  const { persistResolvedEntry, selectCredential, clearSelectedCredential } = useCredentialMutations();
  const activeRequest = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!router.isReady || !clientId) {
      activeRequest.current = null;
      setCompletedPath(null, false);
      return;
    }
    if (activeRequest.current?.path !== router.asPath) activeRequest.current = null;
    if (!hasFetchedApplications || activeRequest.current) return;
    const request = { path: router.asPath };
    activeRequest.current = request;
    const isCurrent = () => mounted.current && activeRequest.current === request;
    const existing = applications.find((entry) => entry.clientId === clientId);
    const agency = typeof router.query.agency === "string" ? router.query.agency : existing?.agency;
    const profile = typeof router.query.profile === "string" ? router.query.profile : existing?.profile;

    async function connect() {
      try {
        if (existing?.token) {
          selectCredential(existing.token, profile, agency, existing);
        } else {
          clearSelectedCredential();
          const response = await resolveCredential({ value: clientId, agency });
          if (!isCurrent()) return;
          if (response?.safeEntry) {
            // Keep unresolved clients in the list so they can be fixed in Clients.
            persistResolvedEntry(
              { ...response.safeEntry, agency, profile },
              { select: Boolean(response.safeEntry.token) },
            );
          }
        }
      } catch {
        // Connection problems are handled through the existing Clients modal.
      } finally {
        if (isCurrent()) {
          setCompletedPath(request.path, false);
          const url = new URL(window.location.href);
          ["clientId", "agency", "profile"].forEach((key) => url.searchParams.delete(key));
          await router.replace(url.pathname + url.search + url.hash, undefined, {
            shallow: true,
            scroll: false,
          });
        }
      }
    }

    connect().catch(() => {});
  }, [applications, hasFetchedApplications, clientId, router, router.isReady, router.asPath, resolveCredential,
    persistResolvedEntry, selectCredential, clearSelectedCredential, setCompletedPath]);
}
