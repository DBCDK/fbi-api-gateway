import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useTheme from "@/hooks/useTheme";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import History from "@/components/history";
import Token from "@/components/token";
import Profile from "@/components/profile";
import Mode from "@/components/mode";

import Modal, { Pages } from "@/components/modal";

import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const elRef = useRef();
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
  const { configuration } = useConfiguration(selectedToken);
  const { icon, theme } = useTheme();

  const isValidToken =
    selectedToken &&
    configuration &&
    Object?.keys(configuration).length &&
    configuration.agency;

  const isIndex = router.pathname === "/";
  const isDocumentation = router.pathname === "/documentation";
  const isSchema = router.pathname === "/schema";
  const isTemp = theme === "temp";

  const indexStyles = isIndex ? styles.index : "";
  const documentationStyles = isDocumentation ? styles.documentation : "";
  const schemaStyles = isSchema ? styles.schema : "";

  const stickyClass = isSticky ? styles.sticky : "";

  return (
    <header
      className={`${styles.top} ${stickyClass} ${indexStyles} ${documentationStyles} ${schemaStyles}`}
      ref={elRef}
    >
      <Container fluid>
        <Row>
          <Col className={styles.left}>
            <Title className={styles.logo}>
              <span>
                <Link href="/">FBI API</Link> {icon}
              </span>
            </Title>
          </Col>

          <Col as="nav" className={styles.links}>
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
            <Text type="text5" className={`${styles.link} ${styles.more}`}>
              <Link onClick={() => setShow(true)}>More</Link>
            </Text>
            <Text type="text5" className={`${styles.link} ${styles.download}`}>
              <Link href="/schema" disabled={!isValidToken}>
                Schema
              </Link>
            </Text>
            {isTemp && (
              <Text type="text5" className={`${styles.link} ${styles.changes}`}>
                <Link href="/changes" disabled={!isValidToken}>
                  [Changes]
                </Link>
              </Text>
            )}
          </Col>

          <Col className={styles.middle}>
            {!isIndex && <Token className={styles.token} compact />}
            <Profile className={styles.profiles} />
            <History className={styles.history} />
          </Col>
        </Row>
        <Mode className={styles.darkmode} />
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
