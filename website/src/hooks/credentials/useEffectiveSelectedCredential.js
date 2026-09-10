import useResolvedConfiguration from "../resolved/useResolvedConfiguration";
import useSelectedCredential from "./useSelectedCredential";

export default function useEffectiveSelectedCredential() {
  const { selectedCredential, setSelectedCredential, clearSelectedCredential } =
    useSelectedCredential();
  const { configuration } = useResolvedConfiguration(selectedCredential);
  const resolvedToken = configuration?.resolvedToken || null;
  const effectiveCredential =
    selectedCredential && resolvedToken
      ? {
          ...selectedCredential,
          token: resolvedToken,
        }
      : selectedCredential;

  return {
    selectedCredential,
    effectiveCredential,
    effectiveToken: effectiveCredential?.token || null,
    resolvedToken,
    setSelectedCredential,
    clearSelectedCredential,
  };
}
