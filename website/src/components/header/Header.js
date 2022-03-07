import { useRouter } from "next/router";
import { Container, Row, Col } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import { useModal } from "@/components/modal";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Token from "@/components/token";
import History from "@/components/history";

import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();

  const modal = useModal();

  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const isValidToken =
    selectedToken && configuration && Object?.keys(configuration).length;

  const isIndex = router.pathname === "/";
  const isDocumentation = router.pathname === "/documentation";

  const indexStyles = isIndex ? styles.index : "";

  return (
    <header className={`${styles.top} ${indexStyles}`}>
      <Container fluid>
        <Row>
          <Col className={styles.left}>
            <Title className={styles.logo}>
              <span>
                <Link href="/">DBC Gateway</Link> 🥳
              </span>
            </Title>
          </Col>

          <Col as="nav" className={styles.links}>
            <Text type="text5" className={styles.link}>
              <Link href="/documentation" disabled={!isValidToken}>
                Docs
              </Link>
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
          {!isIndex && (
            <Col className={styles.middle}>
              <Token className={styles.token} compact />
              <History className={styles.history} compact />
            </Col>
          )}
        </Row>
      </Container>
    </header>
  );
}
