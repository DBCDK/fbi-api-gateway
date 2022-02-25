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
      <Row className={styles.top}>
        <Col xs={12}>
          <Title type="title4" className={styles.title}>
            ... More
          </Title>
          {/* <Button
            className={styles.close}
            onClick={(e) => modal.clear()}
            secondary
          >
            <Text>✖</Text>
          </Button> */}
        </Col>
      </Row>
      <Row className={styles.middle}>
        <Col className={styles.token}>
          <Label for="token-input">
            <Text type="text5">Gateway token</Text>
          </Label>
          <Token className={styles.input} />
        </Col>
      </Row>
      <Row as="ul">
        <Col xs={12} as="li">
          <Link href="/" disabled={!selectedToken}>
            <Text type="text5" className={styles.link}>
              Home
            </Text>
          </Link>
        </Col>

        <Col xs={12} as="li">
          <Link href="/documentation" disabled={!selectedToken}>
            <Text type="text5" className={styles.link}>
              Docs
            </Text>
          </Link>
        </Col>

        <Col xs={12} as="li">
          <Link href="/graphiql" disabled={!selectedToken}>
            <Text type="text5">GraphiQL</Text>
          </Link>
        </Col>

        <Col xs={12} as="li">
          <Link href="/voyager" disabled={!selectedToken}>
            <Text type="text5" className={styles.link}>
              Voyager
            </Text>
          </Link>
        </Col>
      </Row>
      <hr />
      <Row as="ul">
        <Col xs={12} as="li">
          <Link onClick={() => {}} disabled={!selectedToken}>
            <Text type="text5" className={styles.link}>
              View GraphQL Schema
            </Text>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

export default Menu;
