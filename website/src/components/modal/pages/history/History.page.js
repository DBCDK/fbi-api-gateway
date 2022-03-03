import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Collapse from "react-bootstrap/Collapse";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import { dateTimeConverter } from "@/components/utils";
import Text from "@/components/base/text";
import Title from "@/components/base/title";
import Button from "@/components/base/button";

import { isToken } from "@/components/utils";

import styles from "./History.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */

function Item({
  token,
  timestamp,
  inUse,
  configuration,
  isExpired,
  isVisible,
}) {
  const { setSelectedToken, removeHistoryItem } = useStorage();

  const [open, setOpen] = useState(inUse);
  const [removed, setRemoved] = useState(false);

  // update state on modal close
  useEffect(() => {
    if (!isVisible) {
      setTimeout(() => setOpen(inUse), 200);
    }
  }, [isVisible]);

  const ExpiredDisplay = "This token is expired 😔";

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId;
  const authenticated = !!configuration?.uniqueId;
  const date = dateTimeConverter(timestamp);

  const inUseClass = inUse ? styles.inUse : "";
  const expiredClass = isExpired ? styles.expired : "";
  const crossClass = open ? styles.less : styles.more;

  return (
    <Collapse in={!removed}>
      <Col xs={12} className={`${styles.item} ${expiredClass} ${inUseClass}`}>
        <Row>
          <Col xs={12} className={styles.display}>
            <Text type="text5">{isExpired ? ExpiredDisplay : displayName}</Text>
            <button
              className={`${styles.cross} ${crossClass}`}
              onClick={() => setOpen(!open)}
              aria-controls="example-collapse-text"
              aria-expanded={open}
            >
              <span />
              <span />
              {/* <Title type="title5">{open ? "-" : "+"}</Title> */}
            </button>
          </Col>
          <Collapse in={open}>
            <Row id="example-collapse-text">
              <Col xs={12} className={styles.date}>
                <Text type="text4">Submitted at</Text>
                <Text type="text1">{date}</Text>
              </Col>

              {!isExpired && (
                <Col xs={12} className={styles.id}>
                  <Text type="text4">ClientID</Text>
                  <Text type="text1">{clientId}</Text>
                </Col>
              )}
            </Row>
          </Collapse>
          <Col xs={12} className={styles.token}>
            <Text type="text4">
              {authenticated ? "Authenticated" : "Anonymous"} Token
            </Text>
            <Text type="text1">{token}</Text>
          </Col>
        </Row>

        <Row>
          <hr />
          <Col className={styles.buttons}>
            <Button
              size="small"
              onClick={() => {
                removeHistoryItem(token);
                setRemoved(true);
              }}
              secondary
            >
              Remove
            </Button>
            <Button
              className={styles.use}
              disabled={isExpired}
              size="small"
              onClick={() => {
                setSelectedToken(token);
              }}
              primary
            >
              {inUse ? "I'm in use" : "Use"}
            </Button>
          </Col>
        </Row>
      </Col>
    </Collapse>
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

function Wrap(props) {
  const { configuration } = useConfiguration(props.token);

  if (!configuration) {
    return "loading...";
  }

  const isExpired = !Object.keys(configuration || {}).length;

  return (
    <Item {...props} configuration={configuration} isExpired={isExpired} />
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
  const [state, setState] = useState(history);

  // update history on modal close
  useEffect(() => {
    if (!modal.isVisible) {
      setState(history);
    }
  }, [modal.isVisible, history]);

  return (
    <Container className={`${styles.history}`}>
      <Row className={styles.keys}>
        <Col>
          <Row>
            {state?.map((h) => {
              if (isToken(h.token)) {
                return (
                  <Wrap
                    key={h.token}
                    isVisible={modal.isVisible}
                    inUse={selectedToken === h.token}
                    {...h}
                  />
                );
              }
            })}
          </Row>
        </Col>
      </Row>
    </Container>
  );
}

export default History;
