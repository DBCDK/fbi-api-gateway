/**
 * @file Compatibility wrapper around the shared resolved configuration hook.
 */
import useResolvedConfiguration from "../resolved/useResolvedConfiguration";

export default function useCredentialConfiguration({
  id = null,
  token = null,
  agency = null,
  lookupByEntryId = false,
  enabled = true,
} = {}) {
  const props = lookupByEntryId
    ? {
        id,
        type: "client",
        clientId: id,
        token,
        agency,
      }
    : {
        id,
        token,
        agency,
      };
  const { configuration, status, isLoading, mutate } = useResolvedConfiguration(
    props,
    { enabled }
  );

  return {
    configuration: configuration || {},
    status,
    isLoading,
    mutate,
  };
}
