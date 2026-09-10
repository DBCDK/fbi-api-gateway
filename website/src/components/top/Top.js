import { useRouter } from "next/router";
import { Container } from "react-bootstrap";
import useResolvedConfiguration from "@/hooks/resolved/useResolvedConfiguration";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import Agencies from "./agencies";
import Profile from "./profile";
import Styles from "./Top.module.css";

export default function Top({ className = "" }) {
  const router = useRouter();
  const { selectedCredential: selectedToken } = useSelectedCredential();

  const { status, isLoading } = useResolvedConfiguration(selectedToken);

  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";

  const isIndex = router.pathname === "/";

  if (isIndex || !selectedToken?.token || hasValidationError) {
    return null;
  }

  return (
    <div className={`${Styles.top} ${className}`.trim()}>
      <Container fluid className={Styles.container}>
        <Agencies />
        <Profile />
      </Container>
    </div>
  );
}
