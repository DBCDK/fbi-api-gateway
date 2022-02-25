import { useRouter } from "next/router";
import { Container, Row, Col } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";

import { useModal } from "@/components/modal";

import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Token from "@/components/token";

import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();

  const modal = useModal();

  const { selectedToken } = useStorage();

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
              <Link href="/documentation" disabled={!selectedToken}>
                Docs
              </Link>
            </Text>
            <Text type="text5" className={styles.link}>
              <Link href="/graphiql" disabled={!selectedToken}>
                GraphiQL
              </Link>
            </Text>
            <Text type="text5" className={styles.link}>
              <Link href="/voyager" disabled={!selectedToken}>
                Voyager
              </Link>
            </Text>
            <Text type="text5" className={`${styles.link} ${styles.more}`}>
              <Link onClick={() => modal.push("menu")}>More</Link>
            </Text>
            <Text type="text5" className={`${styles.link} ${styles.download}`}>
              <Link disabled={!selectedToken} onClick={() => {}}>
                Download
              </Link>
            </Text>
          </Col>

          <Col className={styles.middle}>
            {!isIndex && <Token className={styles.token} compact />}
          </Col>
        </Row>
      </Container>
    </header>
  );
}
