import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useTheme from "@/hooks/useTheme";
import { hasAvailableAgency } from "@/utils/configuration";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Overlay from "@/components/base/overlay";
import History from "@/components/history";
import Token from "@/components/token";

import Modal, { Pages } from "@/components/modal";

import styles from "./Header.module.css";
import Settings from "@/components/settings";
import Top from "../top";
import useUser from "@/hooks/useUser";
import More from "../more";

export default function Header() {
  const router = useRouter();
  const elRef = useRef();
  const infoRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setIsSticky(e.intersectionRatio < 1),
      { threshold: [1] }
    );

    observer.observe(elRef.current);

    return () => observer.disconnect();
  }, [elRef]);

  const { selectedToken } = useStorage();
  const { configuration, status, isLoading } = useConfiguration(selectedToken);
  const { icon, theme } = useTheme();

  const { user } = useUser(selectedToken);

  const isValidToken =
    selectedToken &&
    configuration &&
    Object?.keys(configuration).length &&
    hasAvailableAgency(configuration);

  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";
  const effectiveProfile =
    selectedToken?.profile ?? configuration?.profiles?.[0] ?? null;
  const hasMissingClientConfiguration =
    Boolean(selectedToken?.token) &&
    !isLoading &&
    status === "OK" &&
    (!effectiveProfile || !hasAvailableAgency(configuration));

  const displayName = configuration?.displayName;
  const isAuthenticated = user?.isAuthenticated;

  const isIndex = router.pathname === "/";
  const isDocumentation = router.pathname === "/documentation";
  const isSchema = router.pathname === "/schema";
  const isTemp = theme === "temp";
  const isFuture = theme === "future";
  const isOld = theme === "old";

  const isTest = theme === "test" || theme === "fbstest";

  const indexStyles = isIndex ? styles.index : "";
  const documentationStyles = isDocumentation ? styles.documentation : "";
  const schemaStyles = isSchema ? styles.schema : "";

  const stickyClass = isSticky ? styles.sticky : "";

  return (
    <header
      className={`${styles.header} ${stickyClass} ${indexStyles} ${documentationStyles} ${schemaStyles}`}
      ref={elRef}
    >
      <Top className={styles.top} />
      <Container fluid>
        <Row className={styles.row}>
          <Col className={styles.left}>
            <Title className={styles.logo}>
              <span>
                <Link href="/">
                  {(isOld || isTest) && (
                    <strong>{`[${isTest ? "test" : "old"}]`}</strong>
                  )}{" "}
                  FBI API
                </Link>{" "}
                {icon}
              </span>
            </Title>
          </Col>

          <Col className={styles.right}>
            <nav className={styles.links}>
              <Text type="text5" className={styles.link}>
                <Link href="/documentation">Docs</Link>
              </Text>
              <Text type="text5" className={styles.link}>
                <Link href="/graphiql" disabled={!isValidToken}>
                  GraphiQL
                </Link>
              </Text>
              <Text type="text5" className={styles.link}>
                <Link href="/voyager" disabled={!isValidToken}>
                  Voyager
                </Link>
              </Text>
              <Text
                type="text5"
                className={`${styles.link} ${styles.download}`}
              >
                <Link href="/schema" disabled={!isValidToken}>
                  Schema
                </Link>
              </Text>
              {(isTemp || isFuture) && (
                <Text
                  type="text5"
                  className={`${styles.link} ${styles.changes}`}
                >
                  <Link href="/changes" disabled={!isValidToken}>
                    [Changes]
                  </Link>
                </Text>
              )}
            </nav>
            <span />

            {!isIndex && selectedToken && !isLoading && !hasValidationError && (
              <div
                ref={infoRef}
                className={`${styles.info} ${
                  hasMissingClientConfiguration ? styles.infoWarning : ""
                }`}
              >
                <div>
                  <Text type="text4">{displayName}</Text>
                </div>
                <div>
                  <Text type="text0">
                    {isAuthenticated ? "Authenticated" : "Anonymous"}
                  </Text>
                </div>
              </div>
            )}
            <Overlay
              className={styles.infoOverlay}
              show={Boolean(hasMissingClientConfiguration)}
              container={infoRef}
              placement="bottom"
            >
              <Text type="text1">Missing client configuration 😵‍💫</Text>
            </Overlay>

            <History className={styles.history} />
          </Col>
        </Row>
        <Settings className={styles.settings} />
        <More className={styles.more} onClick={() => setShow(true)} />
      </Container>

      <div className={styles.border} />

      <Modal
        show={show}
        onHide={() => setShow(false)}
        title=" "
        className={styles.modal}
      >
        <Pages.Menu modal={{ isVisible: show }} />
      </Modal>
    </header>
  );
}
