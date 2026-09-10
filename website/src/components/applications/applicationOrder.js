export function reorderSelectedApplication(
  selectedCredential,
  setCredentialEntry
) {
  if (!selectedCredential?.token) {
    return false;
  }

  setCredentialEntry(selectedCredential, false);
  return true;
}
