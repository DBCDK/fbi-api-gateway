import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Container, Row, Col } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import { useModal } from "@/components/modal";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import History from "@/components/history";
// import TokenStatus from "@/components/tokenstatus";
import Token from "@/components/token";
import Profile from "@/components/profile";

import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const modal = useModal();
  const elRef = useRef();
  const [isSticky, setIsSticky] = useState(false);

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

  const isValidToken =
    selectedToken && configuration && Object?.keys(configuration).length && configuration.agency;

  const isIndex = router.pathname === "/";
  const isDocumentation = router.pathname === "/documentation";

  const indexStyles = isIndex ? styles.index : "";
  const documentationStyles = isDocumentation ? styles.documentation : "";

  const stickyClass = isSticky ? styles.sticky : "";

  return (
    <header
      className={`${styles.top} ${stickyClass} ${indexStyles} ${documentationStyles}`}
      ref={elRef}
    >
      <Container fluid>
        <Row>
          <Col className={styles.left}>
            <Title className={styles.logo}>
              <span>
                <Link href="/">FBI API</Link> 🥳
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
              <Link onClick={() => modal.push("menu")}>More</Link>
            </Text>
            <Text type="text5" className={`${styles.link} ${styles.download}`}>
              <Link href="/schema" disabled={!isValidToken}>
                Schema
              </Link>
            </Text>
          </Col>
          <Col className={styles.middle}>
            {!isIndex && <Token className={styles.token} compact />}
            <Profile className={styles.profiles} />
            <History className={styles.history} />
          </Col>
        </Row>
      </Container>
    </header>
  );
}
