import { Container } from "react-bootstrap";
import Profile from "./profile";
import Agencies from "./agencies";
import Styles from "./Top.module.css";
import { useRouter } from "next/router";
import useResolvedConfiguration from "@/hooks/resolved/useResolvedConfiguration";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";

export default function Top() {
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
    <div className={Styles.top}>
      <Container fluid className={Styles.container}>
        <Agencies />
        <Profile />
      </Container>
    </div>
  );
}
