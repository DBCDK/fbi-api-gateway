import { useEffect } from "react";

import Dropdown from "react-bootstrap/Dropdown";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import styles from "./Profile.module.css";

export default function Profile({ id = "dropdown", className = "" }) {
  // useToken custom hook
  const { selectedToken, setSelectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const isToken = selectedToken?.token && configuration?.agency;
  const hasProfile = selectedToken?.profile;
  const hasProfiles = configuration?.profiles;

  const sortedProfiles = hasProfiles?.sort();

  // check if selected profile exist on list
  const isProfile =
    hasProfile && hasProfiles && configuration?.profiles.includes(hasProfile);

  useEffect(() => {
    // useEffect to update profile on token if token configuration includes a profile list
    if (hasProfiles) {
      if (
        // if token doesn't have a profile yet
        (isToken && !hasProfile) ||
        // if the attached profile is not valid (not a part of the configuration profile list)
        !isProfile
      ) {
        const profile = configuration?.profiles?.[0];
        setSelectedToken(selectedToken?.token, profile);
      }
    }
  }, [configuration?.profiles]);

  const selectedProfile =
    (isProfile && selectedToken?.profile) || configuration?.profiles?.[0];

  if (!(isToken && hasProfiles)) {
    return null;
  }

  return (
    <Dropdown
      className={`${styles.dropdown} ${className}`}
      align="end"
      title="Search profile"
    >
      <Dropdown.Toggle id={id} className={styles.toggle}>
        {hasProfile === "none" && (
          <i title="no profiles found for associated agency">⚠️</i>
        )}{" "}
        {selectedProfile}
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.menu}>
        <Dropdown.Header>Search Profiles</Dropdown.Header>
        {/* <Dropdown.Divider /> */}
        {sortedProfiles?.map((p) => {
          const selected = p === hasProfile;
          const selectedClass = selected ? styles.selected : "";
          return (
            <Dropdown.Item
              key={p}
              className={`${styles.item} ${selectedClass}`}
              onClick={() => setSelectedToken(selectedToken?.token, p)}
            >
              {p}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}
