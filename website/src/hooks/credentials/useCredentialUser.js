/**
 * @file Compatibility wrapper around the shared resolved user hook.
 */
import useResolvedUser from "../resolved/useResolvedUser";

export default function useCredentialUser({
  id = null,
  token = null,
  clientId = null,
  profile = null,
  lookupByEntryId = false,
  enabled = true,
} = {}) {
  const props = lookupByEntryId
    ? {
        id,
        type: "client",
        clientId: clientId || id,
        token,
        profile,
      }
    : {
        id,
        token,
        profile,
      };
  const { user, isLoading, hasResolvedUserStatus, mutate } = useResolvedUser(
    props,
    { enabled }
  );

  return {
    user,
    isLoading,
    hasResolvedUserStatus,
    mutate,
  };
}
