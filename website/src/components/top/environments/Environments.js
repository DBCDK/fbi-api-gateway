import { useRouter } from "next/router";
import FilterDropdown from "@/components/base/filter-dropdown";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import { environmentHref } from "@/utils/environmentNavigation";
import styles from "./Environments.module.css";

export default function Environments({ id = "environment-dropdown", className = "" }) {
  const { isInternal, environments } = useCredentialNetwork();
  const { selectedCredential } = useSelectedCredential();
  const router = useRouter();

  if (!isInternal || !environments.length || !router.isReady) return null;

  const credential = typeof router.query.clientId === "string"
    ? { clientId: router.query.clientId, agency: router.query.agency, profile: router.query.profile }
    : selectedCredential;
  const current = environments.find((item) => item.url === window.location.origin) || {
    name: window.location.host,
    url: window.location.origin,
  };

  return (
    <FilterDropdown
      id={id}
      className={`${styles.dropdown} ${className}`}
      items={environments}
      selectedItem={current}
      onSelect={(item) => {
        if (item.url !== window.location.origin) {
          window.location.assign(environmentHref(item.url, window.location.href, credential));
        }
      }}
      itemKey={(item) => item?.url || ""}
      itemToString={(item) => item?.name || ""}
      itemTitle={(item) => item?.url || ""}
      selectedItemTitle={(item) => item?.url || ""}
      renderItem={(item, { highlightedLabel }) => (
        <span className={styles.itemLabel}>
          <span className={styles.name}>{highlightedLabel}</span>
          <button
            type="button"
            className={styles.newTab}
            title={`Open ${item.name} in a new tab`}
            aria-label={`Open ${item.name} in a new tab`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              window.open(
                environmentHref(item.url, window.location.href, credential),
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 3h7v7M21 3 10 14M10 3H3v18h18v-7" />
            </svg>
          </button>
        </span>
      )}
      filterPlaceholder="Filter environments ..."
      menuLabel="Environments"
      noResultsLabel="No environments found"
    />
  );
}
