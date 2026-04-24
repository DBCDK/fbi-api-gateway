import { Container } from "react-bootstrap";
import Profile from "./profile";
import Agencies from "./agencies";
import Styles from "./Top.module.css";
import { useRouter } from "next/router";

export default function Top() {
  const router = useRouter();

  const isIndex = router.pathname === "/";

  if (isIndex) {
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
