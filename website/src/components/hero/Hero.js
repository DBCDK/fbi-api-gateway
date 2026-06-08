import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import { useRouter } from "next/router";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useTheme from "@/hooks/useTheme";

import Title from "@/components/base/title";
import Connect from "@/components/connect";
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
  const [canSubmitCredential, setCanSubmitCredential] = useState(false);
  const [isSubmittingCredential, setIsSubmittingCredential] = useState(false);
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
  const inputIsValid = hasResolvedCredential || canSubmitCredential;

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
              <Connect
                id="token-input"
                className={styles.token}
                onValidityChange={setCanSubmitCredential}
                onPendingChange={setIsSubmittingCredential}
                onSubmit={() => {
                  router.push({
                    pathname: "/documentation",
                  });
                }}
              />
              {/* <Text type="text1" className={styles.help}>
                No token? Connect with a clientId{" "}
                <button
                  type="button"
                  className={styles.helpLink}
                  onClick={handleOpenClientConnect}
                >
                  here!
                </button>
              </Text> */}
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
              disabled={!inputIsValid || isSubmittingCredential}
              form="token-input-form"
              secondary
            >
              {isSubmittingCredential ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className={styles.goSpinner}
                  />
                </>
              ) : (
                "Go!"
              )}
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
