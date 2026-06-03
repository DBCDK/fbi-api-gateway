import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useRouter } from "next/router";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useTheme from "@/hooks/useTheme";
import { detectCredentialType } from "@/utils/credentials";

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
import Future from "./future";

export default function Hero({ className = "" }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const { selectedToken } = useStorage();
  const { configuration, status, isLoading } = useConfiguration(selectedToken);
  const { theme } = useTheme();

  const isChristmas = theme === "christmas";
  const isEaster = theme === "easter";
  const isPride = theme === "pride";
  const isHalloween = theme === "halloween";
  const isFuture = theme === "future";

  const hasResolvedCredential =
    Boolean(selectedToken?.token) &&
    !isLoading &&
    status === "OK" &&
    Boolean(configuration?.displayName);
  const hasValidInput = Boolean(detectCredentialType(inputValue));
  const inputIsValid = hasResolvedCredential || hasValidInput;

  return (
    <section className={`${styles.hero} ${className}`} id="hero">
      <div className={styles.color} />
      <div className={styles.silhouette} />
      {isChristmas && <Christmas />}
      {isEaster && <Chicken />}
      {isPride && <Pride />}
      {isHalloween && <Halloween />}
      {isFuture && <Future />}
      <Container>
        <Row className={styles.row}>
          <Col>
            <Title className={styles.title}>
              <Label for="token-input">
                Connect your application to get started
              </Label>
            </Title>
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Token
              id="token-input"
              className={styles.token}
              onChange={setInputValue}
              onSubmit={() => {
                router.push({
                  pathname: "/documentation",
                });
              }}
            />
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
