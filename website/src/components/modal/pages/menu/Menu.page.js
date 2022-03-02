import { Container, Row, Col } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";

import Token from "@/components/token";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Label from "@/components/base/label";
import Button from "@/components/base/button";

import styles from "./Menu.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */

function Menu({ modal, context }) {
  const { selectedToken } = useStorage();

  return (
    <Container className={`${styles.menu}`}>
      <Row className={styles.middle}>
        <Col>
          <Label for="token-input">
            <Text type="text5">Gateway token</Text>
          </Label>
          <Row>
            <Col className={styles.token}>
              <Token className={styles.input} />
              {/* <Button
                className={styles.history}
                onClick={() => modal.push("history")}
                secondary
              >
                🔑
              </Button> */}
            </Col>
          </Row>
        </Col>
      </Row>
      <Row as="ul">
        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/" disabled={!selectedToken}>
              Home
            </Link>
          </Text>
        </Col>

        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/documentation" disabled={!selectedToken}>
              Docs
            </Link>
          </Text>
        </Col>

        <Col xs={12} as="li">
          <Text type="text5">
            <Link href="/graphiql" disabled={!selectedToken}>
              GraphiQL
            </Link>
          </Text>
        </Col>

        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/voyager" disabled={!selectedToken}>
              Voyager
            </Link>
          </Text>
        </Col>
      </Row>
      <hr />
      <Row as="ul">
        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link onClick={() => {}} disabled={!selectedToken}>
              View GraphQL Schema
            </Link>
          </Text>
        </Col>
      </Row>
    </Container>
  );
}

export default Menu;
