import useCredentialEntries, {
  getCredentialEntryIdentifier,
  getCredentialEntryId,
  matchesCredentialEntry,
  shouldClearSelectedCredentialAfterRemoval,
} from "./credentials/useCredentialEntries";
import useCredentialMutations from "./credentials/useCredentialMutations";
import useSelectedCredential, {
  matchesSelectedCredentialIdentity,
} from "./credentials/useSelectedCredential";

export const getHistoryIdentifier = getCredentialEntryIdentifier;
export const getCanonicalId = getCredentialEntryId;
export { matchesSelectedCredentialIdentity };

export const shouldClearSelectedTokenAfterRemoval =
  shouldClearSelectedCredentialAfterRemoval;

export default function useStorage() {
  const {
    selectedCredential,
    setSelectedCredential,
    clearSelectedCredential,
  } = useSelectedCredential();
  const {
    applications,
    hasFetchedApplications,
    setCredentialEntry,
    getCredentialEntry,
    removeCredentialEntry,
  } = useCredentialEntries();
  const { selectCredential } = useCredentialMutations();

  return {
    selectedToken: selectedCredential,
    setSelectedToken: selectCredential,
    removeSelectedToken: clearSelectedCredential,
    history: applications,
    applications,
    hasFetchedApplications,
    setApplicationEntry: setCredentialEntry,
    getApplicationEntry: getCredentialEntry,
    removeApplicationEntry: removeCredentialEntry,
    setHistoryItem: setCredentialEntry,
    getHistoryItem: getCredentialEntry,
    removeHistoryItem: removeCredentialEntry,
    matchesApplicationEntry: matchesCredentialEntry,
    setSelectedCredential,
  };
}
