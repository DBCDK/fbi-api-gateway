import { useRouter } from "next/router";
import { Container, Row, Col } from "react-bootstrap";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Input from "@/components/base/input";

import styles from "./Top.module.css";

export default function Top() {
  const router = useRouter();
  const isIndex = router.asPath === "/";

  const indexStyles = isIndex ? styles.index : "";

  return (
    <header className={`${styles.top} ${indexStyles}`}>
      <Container>
        <Row>
          <Col className={styles["logo-wrap"]}>
            <Title className={styles.logo}>DBC Gateway 🥳</Title>
          </Col>
          <Col>{!isIndex && <Input placeholder="... Drop token here" />}</Col>
        </Row>
      </Container>
    </header>
  );
}
