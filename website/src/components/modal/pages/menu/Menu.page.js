import { Row, Col } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import Token from "@/components/token";
import Profile from "@/components/profile";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Label from "@/components/base/label";
import Darkmode from "@/components/darkmode";

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
  const { configuration } = useConfiguration(selectedToken);

  const isValidToken =
    selectedToken &&
    configuration &&
    Object?.keys(configuration).length &&
    configuration.agency;

  return (
    <div className={`${styles.menu}`}>
      <Row className={styles.middle}>
        <Col>
          <Label for="token-input">
            <Text type="text1">FBI API token</Text>
          </Label>
          <Row>
            <Col className={styles.token}>
              <Token className={styles.input} compact />
              <Profile className={styles.profiles} />
            </Col>
          </Row>
        </Col>
      </Row>
      <Row as="ul">
        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/">Home</Link>
          </Text>
        </Col>

        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/documentation">Docs</Link>
          </Text>
        </Col>

        <Col xs={12} as="li">
          <Text type="text5">
            <Link href="/graphiql" disabled={!isValidToken}>
              GraphiQL
            </Link>
          </Text>
        </Col>

        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/voyager" disabled={!isValidToken}>
              Voyager
            </Link>
          </Text>
        </Col>
      </Row>
      <hr />
      <Row as="ul">
        <Col xs={12} as="li">
          <Text type="text5" className={styles.link}>
            <Link href="/schema" disabled={!isValidToken}>
              View GraphQL Schema
            </Link>
          </Text>
        </Col>
      </Row>
      <hr />
      <Row as="ul">
        <Col xs={12} as="li">
          <Darkmode className={styles.darkmode} />
        </Col>
      </Row>
    </div>
  );
}

export default Menu;
