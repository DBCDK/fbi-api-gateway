import { useEffect } from "react";

import FilterDropdown from "@/components/base/filter-dropdown";
import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import styles from "./Agencies.module.css";

function normalizeAgencies(agencies) {
  if (Array.isArray(agencies)) {
    return agencies;
  }

  if (typeof agencies === "string") {
    return [agencies];
  }

  return [];
}

function buildAgencyItems({ agencies, agencyId }) {
  const items = normalizeAgencies(agencies)
    .filter(Boolean)
    .map((agency) => String(agency))
    .filter((agency, index, array) => array.indexOf(agency) === index)
    .map((agency) => ({
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
  const { selectedToken, setSelectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const isToken = selectedToken?.token && configuration?.agency;
  const agencyId = configuration?.agency;
  const agencies = configuration?.agencies;

  const agencyItems = buildAgencyItems({
    agencies,
    agencyId,
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

  console.log("#### agencyItems", agencies, agencyItems, selectedAgency);

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
      renderItem={(item) => (
        <span className={styles.itemLabel}>
          <span>{item?.value || ""}</span>
          {item?.isDefault && (
            <span className={styles.defaultBadge}>Default</span>
          )}
        </span>
      )}
      filterPlaceholder="Filter agencies ..."
      menuLabel="Search Agencies"
      noResultsLabel="No agencies found"
    />
  );
}
