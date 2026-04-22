import { Container } from "react-bootstrap";
import Profile from "./profile";
import Agencies from "./agencies";
import Styles from "./Top.module.css";

export default function Top() {
  return (
    <div className={Styles.top}>
      <Container fluid className={Styles.container}>
        <Agencies />
        <Profile />
      </Container>
    </div>
  );
}
