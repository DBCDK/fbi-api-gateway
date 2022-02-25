import { Container, Row, Col } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import Token from "@/components/token";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Link from "@/components/base/link";
import Label from "@/components/base/label";
import Button from "@/components/base/button";

import styles from "./History.module.css";

function Item(props) {
  const { setSelectedToken } = useStorage();
  const { configuration } = useConfiguration(props.token);

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId;
  const authenticated = !!configuration?.uniqueId;

  return (
    <Col xs={12} className={styles.item}>
      <Row>
        <Col xs={12} className={styles.display}>
          <Text type="text5">{displayName}</Text>
        </Col>
        <Col xs={12} className={styles.id}>
          <Text type="text4">ClientID</Text>
          <Text type="text1">{clientId}</Text>
        </Col>
        <Col xs={12} className={styles.token}>
          <Text type="text4">
            {authenticated ? "Authenticated" : "Anonymous"} Token
          </Text>
          <Text type="text1">{props.token}</Text>
        </Col>
      </Row>
      <Row>
        <Col className={styles.buttons}>
          <Button size="small" secondary>
            Remove
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedToken(props.token);
            }}
            primary
          >
            Use
          </Button>
        </Col>
      </Row>
    </Col>
  );
}

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */

function History({ modal, context }) {
  const { history, selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  return (
    <Container className={`${styles.history}`}>
      {/* <Row className={styles.top}>
        <Col>
          <Title type="title4" className={styles.title}>
            ... History
          </Title>
        </Col>
      </Row> */}
      <Row className={styles.selected}>
        <Col>
          <Text type="text4" className={styles.link}>
            Current active token
          </Text>
          <Text type="text1" className={styles.link}>
            {selectedToken}
          </Text>
        </Col>
      </Row>
      <Row className={styles.keys}>
        <Col>
          <Row>
            {history?.map((h) => (
              <Item key={h.token} {...h} />
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default History;
