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
import Text from "@/components/base/text";
import Applications from "@/components/applications";

import Christmas from "./christmas";
import Chicken from "./chicken";
import Pride from "./pride";
import Halloween from "./halloween";

import styles from "./Hero.module.css";
import Future from "./future";

export default function Hero({ className = "" }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [showApplications, setShowApplications] = useState(false);
  const [applicationsOpenMode, setApplicationsOpenMode] = useState("default");

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
  const hasValidInput = detectCredentialType(inputValue) === "token";
  const inputIsValid = hasResolvedCredential || hasValidInput;

  function handleOpenClientConnect() {
    setApplicationsOpenMode("add");
    setShowApplications(true);
  }

  function handleShowApplicationsChange(nextShow) {
    setShowApplications(nextShow);

    if (!nextShow) {
      setApplicationsOpenMode("default");
    }
  }

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
            <div className={styles.inputGroup}>
              <Token
                id="token-input"
                className={styles.token}
                onChange={setInputValue}
                allowClientId={false}
                onSubmit={() => {
                  router.push({
                    pathname: "/documentation",
                  });
                }}
              />
              <Text type="text1" className={styles.help}>
                No token? Connect with a clientId{" "}
                <button
                  type="button"
                  className={styles.helpLink}
                  onClick={handleOpenClientConnect}
                >
                  here!
                </button>
              </Text>
            </div>
            <Applications
              className={styles.history}
              show={showApplications}
              onShowChange={handleShowApplicationsChange}
              openAddOnShow={applicationsOpenMode === "add"}
            />
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
