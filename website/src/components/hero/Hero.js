import { Container, Row, Col } from "react-bootstrap";
import { useRouter } from "next/router";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useTheme from "@/hooks/useTheme";

import Title from "@/components/base/title";
import Token from "@/components/token";
import Button from "@/components/base/button";
import Label from "@/components/base/label";
import History from "@/components/history";

import Christmas from "./christmas";
import Chicken from "./chicken";
import Pride from "./pride";
import Halloween from "./halloween";

import styles from "./Hero.module.css";

export default function Hero({ className = "" }) {
  const router = useRouter();

  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);
  const { theme } = useTheme();

  const isChristmas = theme === "christmas";
  const isEaster = theme === "easter";
  const isPride = theme === "pride";
  const isHalloween = theme === "halloween";

  const inputIsValid =
    selectedToken && configuration && Object?.keys(configuration).length;

  return (
    <section className={`${styles.hero} ${className}`} id="hero">
      <div className={styles.color} />
      <div className={styles.silhouette} />
      {isChristmas && <Christmas />}
      {isEaster && <Chicken />}
      {isPride && <Pride />}
      {isHalloween && <Halloween />}
      <Container>
        <Row className={styles.row}>
          <Col>
            <Title className={styles.title}>
              <Label for="token-input">
                Drop your token here to get started
              </Label>
            </Title>
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Token id="token-input" className={styles.token} />
            <History className={styles.history} />
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Button
              className={styles.go}
              type="submit"
              disabled={!inputIsValid}
              form="token-input-form"
              onClick={() => {
                router.push({
                  pathname: "/documentation",
                });
              }}
              secondary
            >
              Go!
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
