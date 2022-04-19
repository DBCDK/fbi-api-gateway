import { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Collapse from "react-bootstrap/Collapse";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import Input from "@/components/base/input";

import { dateTimeConverter } from "@/components/utils";
import Text from "@/components/base/text";
import Title from "@/components/base/title";
import Button from "@/components/base/button";

import { isToken, isEqual } from "@/components/utils";

import styles from "./History.module.css";

function CreateForm() {
  const { setSelectedToken } = useStorage();

  return (
    <Col xs={12} className={styles.createform}>
      <Row>
        <Title type="title1" tag="h2">
          Create Access Configuration
        </Title>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSelectedToken(
              e.target.accessToken.value,
              e.target.agency.value,
              e.target.profile.value
            );
          }}
        >
          <div className={styles.inputfield}>
            <label for="accessToken">Access Token</label>
            <Input
              name="accessToken"
              placeholder="Access Token"
              id="accessToken"
              required
            />
          </div>
          <div className={styles.inputfield}>
            <label for="agency">Agency ID</label>
            <Input name="agency" placeholder="Agency ID" id="agency" required />
          </div>
          <div className={styles.inputfield}>
            <label for="profile">Profile Name</label>
            <Input
              name="profile"
              placeholder="Profile Name"
              id="profile"
              required
            />
          </div>

          <div className={styles.formbutton}>
            <Button type="submit" className={styles.use} size="small" primary>
              Create
            </Button>
          </div>
        </form>
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

function Item({
  token,
  agency,
  profile,
  timestamp,
  inUse,
  configuration,
  isExpired,
  // isVisible,
}) {
  const { selectedToken, setSelectedToken, removeHistoryItem } = useStorage();

  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);

  // update state on modal close
  // useEffect(() => {
  //   if (!isVisible) {
  //     setTimeout(() => setOpen(inUse), 200);
  //   }
  // }, [isVisible]);

  // useEffect(() => {
  //   setOpen(inUse);
  // }, [selectedToken]);

  const ExpiredDisplay = "This token is expired 😔";

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId;
  const authenticated = !!configuration?.uniqueId;
  const date = dateTimeConverter(timestamp);

  const inUseClass = inUse ? styles.inUse : "";
  const expiredClass = isExpired ? styles.expired : "";
  const crossClass = open ? styles.less : styles.more;

  return (
    <Collapse in={!removed} id={`container-collapse-${token}`}>
      <Col xs={12} className={`${styles.item} ${expiredClass} ${inUseClass}`}>
        <Row>
          <Col xs={12} className={styles.display}>
            <Text type="text5">
              {isExpired ? (
                ExpiredDisplay
              ) : (
                <>
                  {displayName}
                  <span className={styles.authenticated}>
                    {authenticated ? "AUTHENTICATED" : "ANONYMOUS"}
                  </span>
                </>
              )}
            </Text>

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
          <Collapse in={open} id={`details-collapse-${token}`}>
            <Row id="example-collapse-text">
              <Col xs={12} className={styles.date}>
                <Text type="text4">Submitted at</Text>
                <Text type="text1">{date}</Text>
              </Col>
              <Col xs={12} className={styles.date}>
                <Text type="text4">Access token</Text>
                <Text type="text1">{token}</Text>
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
            <Text type="text4">Agency</Text>
            <Text type="text1">{agency}</Text>
            <Text type="text4" className={styles.label}>
              Profile
            </Text>
            <Text type="text1">{profile}</Text>
          </Col>
        </Row>

        <Row>
          <hr />
          <Col className={styles.buttons}>
            <Button
              className={styles.remove}
              size="small"
              onClick={() => {
                removeHistoryItem(token, agency, profile);
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
                setSelectedToken(token, agency, profile);
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
  const { configuration, isLoading } = useConfiguration(props);

  if (isLoading) {
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
      setTimeout(() => setState(history), 200);
    }
  }, [modal.isVisible]);

  // update history on history length change
  useEffect(() => {
    setTimeout(() => setState(history), 200);
  }, [history.length]);

  return (
    <div className={`${styles.history}`}>
      <Row className={styles.keys}>
        <Col>
          <Row>
            <CreateForm />
          </Row>
          <Row>
            <hr />
          </Row>

          <Row className={styles.configurations}>
            <Title type="title1" tag="h2">
              Previously Used Configurations
            </Title>
            {state?.map((h) => {
              return (
                <Wrap
                  key={JSON.stringify(h)}
                  isVisible={modal.isVisible}
                  inUse={isEqual(selectedToken, h)}
                  {...h}
                />
              );
            })}
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default History;
