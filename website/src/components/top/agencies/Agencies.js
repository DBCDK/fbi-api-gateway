import { useEffect } from "react";

import FilterDropdown from "@/components/base/filter-dropdown";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";
import useResolvedConfiguration from "@/hooks/resolved/useResolvedConfiguration";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import {
  getAvailableAgencies,
  hasAvailableAgency,
} from "@/utils/configuration";

import styles from "./Agencies.module.css";

function buildAgencyItems({ agencies, agencyId }) {
  const items = getAvailableAgencies({ agencies }).map((agency) => ({
    value: agency,
    isDefault: false,
  }));

  if (agencyId) {
    const existingIndex = items.findIndex((item) => item.value === agencyId);

    if (existingIndex >= 0) {
      const promotedItem = {
        ...items[existingIndex],
        isDefault: true,
      };
      items.splice(existingIndex, 1);
      items.unshift(promotedItem);
    } else {
      items.unshift({
        value: agencyId,
        isDefault: true,
      });
    }
  }

  return items;
}

export default function Agencies({ id = "agencies-dropdown", className = "" }) {
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { selectCredential: setSelectedToken } = useCredentialMutations();
  const { configuration } = useResolvedConfiguration(selectedToken);

  const isToken = selectedToken?.token && hasAvailableAgency(configuration);
  const defaultAgencyId = configuration?.defaultAgency || null;
  const agencies = configuration?.agencies;

  const agencyItems = buildAgencyItems({
    agencies,
    agencyId: defaultAgencyId,
  });

  const hasAgencies = agencyItems.length > 0;

  const isValidSelectedAgency = agencyItems.some(
    (item) => item.value === selectedToken?.agency
  );

  const fallbackAgency = agencyItems[0]?.value ?? null;
  const selectedAgency = isValidSelectedAgency
    ? selectedToken?.agency
    : fallbackAgency;

  useEffect(() => {
    if (hasAgencies && selectedAgency !== selectedToken?.agency) {
      setSelectedToken(selectedToken?.token, undefined, selectedAgency);
    }
  }, [
    hasAgencies,
    selectedAgency,
    selectedToken?.agency,
    selectedToken?.token,
    setSelectedToken,
  ]);

  if (!(isToken && hasAgencies && selectedAgency)) {
    return null;
  }

  return (
    <FilterDropdown
      id={id}
      className={`${styles.dropdown} ${className}`}
      items={agencyItems}
      selectedItem={agencyItems.find((item) => item.value === selectedAgency)}
      onSelect={(item) =>
        setSelectedToken(selectedToken?.token, undefined, item.value)
      }
      itemKey={(item) => item.value}
      itemToString={(item) => item?.value || ""}
      selectedItemToString={(item) => item?.value || ""}
      renderItem={(item, { highlightedLabel }) => (
        <span className={styles.itemLabel}>
          <span>{highlightedLabel}</span>
          {item?.isDefault && (
            <span className={styles.defaultBadge}>Default</span>
          )}
        </span>
      )}
      filterPlaceholder="Filter agencies ..."
      menuLabel="Agencies"
      noResultsLabel="No agencies found"
    />
  );
}
