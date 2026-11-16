import { useRouter } from "next/router";
import { Container } from "react-bootstrap";
import useResolvedConfiguration from "@/hooks/resolved/useResolvedConfiguration";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import Environments from "./Environments";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import Agencies from "./agencies";
import Profile from "./profile";
import Styles from "./Top.module.css";

export default function Top({ className = "" }) {
  const router = useRouter();
  const { isInternal, environments } = useCredentialNetwork();
  const { selectedCredential: selectedToken } = useSelectedCredential();

  const { status, isLoading } = useResolvedConfiguration(selectedToken);

  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";

  const isIndex = router.pathname === "/";

  const showCredentials = !isIndex && selectedToken?.token && !hasValidationError;
  if (isIndex || (!showCredentials && !(isInternal && environments.length))) {
    return null;
  }

  return (
    <div className={`${Styles.top} ${className}`.trim()}>
      <Container fluid className={Styles.container}>
        <Environments />
        {showCredentials && <><Agencies /><Profile /></>}
      </Container>
    </div>
  );
}
