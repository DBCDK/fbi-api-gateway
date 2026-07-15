import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import { useRouter } from "next/router";

import useResolvedConfiguration from "@/hooks/resolved/useResolvedConfiguration";
import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import useTheme from "@/hooks/useTheme";
import { hasAvailableAgency } from "@/utils/configuration";

import Title from "@/components/base/title";
import Connect from "@/components/connect";
import Button from "@/components/base/button";
import Label from "@/components/base/label";
import Text from "@/components/base/text";
import Applications from "@/components/applications";
import ClientConnectButton from "./client-connect-button/ClientConnectButton";

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

  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { getCredentialEntry } = useCredentialEntries();
  const { configuration, status, isLoading } =
    useResolvedConfiguration(selectedToken);
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
  const selectedEntry = selectedToken
    ? getCredentialEntry(selectedToken)
    : null;
  const effectiveProfile =
    selectedToken?.profile ?? configuration?.profiles?.[0] ?? null;
  const hasMissingClientConfiguration =
    Boolean(selectedToken) &&
    !isLoading &&
    status === "OK" &&
    (!effectiveProfile || !hasAvailableAgency(configuration));
  const resolvedDisplayName =
    selectedEntry?.note ||
    configuration?.displayName ||
    selectedEntry?.displayName ||
    selectedToken?.clientId ||
    selectedEntry?.clientId ||
    (selectedToken ? "Active client" : "") ||
    "";
  const alternativeDisplayName =
    selectedEntry?.note &&
    configuration?.displayName &&
    selectedEntry.note.trim() !== configuration.displayName
      ? configuration.displayName
      : selectedEntry?.displayName &&
          selectedEntry.displayName !== resolvedDisplayName
        ? selectedEntry.displayName
        : "";
  const hasActiveClientSummary = Boolean(selectedToken && resolvedDisplayName);
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
            </div>
            <Applications
              className={styles.history}
              show={showApplications}
              onShowChange={handleShowApplicationsChange}
              openAddOnShow={applicationsOpenMode === "add"}
            />
            <div className={styles.inputGroupMobile}>
              <div className={styles.helpGroup}>
                <Text type="text1" className={styles.help}>
                  Connect with a token or clientId
                </Text>
                <ClientConnectButton
                  onClick={handleOpenClientConnect}
                  hasActiveClientSummary={hasActiveClientSummary}
                  hasMissingClientConfiguration={
                    hasMissingClientConfiguration
                  }
                  resolvedDisplayName={resolvedDisplayName}
                  alternativeDisplayName={alternativeDisplayName}
                />
              </div>
            </div>
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
