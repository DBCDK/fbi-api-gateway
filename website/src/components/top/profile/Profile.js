import { useEffect } from "react";

import FilterDropdown from "@/components/base/filter-dropdown";
import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import styles from "./Profile.module.css";

export default function Profile({ id = "dropdown", className = "" }) {
  const { selectedToken, setSelectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const isToken = selectedToken?.token && configuration?.agency;
  const hasProfile = selectedToken?.profile;
  const hasProfiles = configuration?.profiles;

  const sortedProfiles = hasProfiles ? [...hasProfiles].sort() : [];

  const isProfile =
    hasProfile && hasProfiles && configuration?.profiles.includes(hasProfile);

  useEffect(() => {
    if (hasProfiles) {
      if ((isToken && !hasProfile) || !isProfile) {
        const profile = configuration?.profiles?.[0];
        setSelectedToken(selectedToken?.token, profile);
      }
    }
  }, [
    configuration?.profiles,
    hasProfile,
    hasProfiles,
    isProfile,
    isToken,
    selectedToken?.token,
    setSelectedToken,
  ]);

  const selectedProfile =
    (isProfile && selectedToken?.profile) || configuration?.profiles?.[0];

  if (!(isToken && hasProfiles)) {
    return null;
  }

  return (
    <FilterDropdown
      id={id}
      className={`${styles.dropdown} ${className}`}
      items={sortedProfiles}
      selectedItem={selectedProfile}
      onSelect={(profile) => setSelectedToken(selectedToken?.token, profile)}
      filterPlaceholder="Filter profiles ..."
      menuLabel="Search Profiles"
      noResultsLabel="No profiles found"
    />
  );
}
