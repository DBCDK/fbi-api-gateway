import { useState, useEffect, useRef } from "react";
import { Container, Row, Col } from "react-bootstrap";
import Collapse from "react-bootstrap/Collapse";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import {
  dateTimeConverter,
  dateConverter,
  timeConverter,
} from "@/components/utils";
import Text from "@/components/base/text";
import Title from "@/components/base/title";
import Button from "@/components/base/button";

import { isEqual } from "@/components/utils";

import styles from "./History.module.css";

/**
 * Loading version of Component
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
function ItemIsLoading() {
  return <div className={`${styles.item} ${styles.isLoading}`} />;
}

/**
 *
 * @param {*} param0
 * @returns
 */

function ExpandButton({ onClick, open }) {
  const crossClass = open ? styles.less : styles.more;

  return (
    <button
      className={`${styles.cross} ${crossClass}`}
      onClick={onClick}
      aria-controls="example-collapse-text"
      aria-expanded={open}
    >
      <div>
        <span />
        <span />
      </div>
    </button>
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
  profile,
  timestamp,
  inUse,
  configuration,
  isExpired,
  // isVisible,
}) {
  const { setSelectedToken, removeHistoryItem } = useStorage();

  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [distance, setDistance] = useState(false);

  // update state on modal close
  // useEffect(() => {
  //   if (!isVisible) {
  //     setTimeout(() => setOpen(inUse), 200);
  //   }
  // }, [isVisible]);

  // useEffect(() => {
  //   setOpen(inUse);
  // }, [selectedToken]);

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId;
  const authenticated = !!configuration?.uniqueId;
  const submitted = {
    date: dateConverter(timestamp),
    time: timeConverter(timestamp),
  };
  const expires = {
    date: dateConverter(configuration?.expires),
    time: timeConverter(configuration?.expires),
  };

  const user = configuration.user;

  const inUseClass = inUse ? styles.inUse : "";
  const expiredClass = isExpired ? styles.expired : "";
  const exapandedClass = open ? styles.expanded : "";
  const exapandedClassGlobal = open ? "expanded" : "";

  const elRef = useRef();

  if (isExpired) {
    return (
      <div ref={elRef} className={`${styles.item} ${styles.expired} `}>
        <div className={styles.content} style={{ top: `${distance}px` }}>
          <div className={styles.display}>
            <div>
              <Text type="text4">This token is expired 😔</Text>
              <Text type="text1">{token}</Text>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (elRef.current?.offsetTop) {
      setDistance(elRef.current.offsetTop);
    }
  }, [elRef.current?.offsetTop]);

  return (
    <div
      ref={elRef}
      className={`${styles.item} ${expiredClass} ${inUseClass} ${exapandedClass} ${exapandedClassGlobal}`}
    >
      <div className={styles.content} style={{ top: `${distance}px` }}>
        <div className={styles.display}>
          <Text
            type={open ? "text6" : "text4"}
            className={styles.display}
            style={{
              color: open ? configuration?.logoColor : "var(--text-dark)",
            }}
          >
            {displayName}
          </Text>
          <Text className={styles.authentication}>
            {`This token is ${
              authenticated ? "AUTHENTICATED 🧑" : "ANONYMOUS"
            }`}
          </Text>
          <ExpandButton onClick={() => setOpen(!open)} open={open} />
        </div>
        <div className={styles.collapsed}>
          <div className={styles.submitted}>
            <Text type="text4">Submitted at</Text>
            <Text type="text1">
              {submitted.date} <span>{submitted.time}</span>
            </Text>
          </div>

          <div className={styles.expires}>
            <Text type="text4">Expiration date</Text>
            <Text type="text1">
              {expires.date} <span>{expires.time}</span>
            </Text>
          </div>

          <div className={styles.token}>
            <Text type="text4">Access token</Text>
            <Text type="text1">{token}</Text>
          </div>

          <div className={styles.clientId}>
            <Text type="text4">ClientID</Text>
            <Text type="text1">{clientId}</Text>
          </div>

          <div className={styles.details}>
            <div>
              <Text type="text4">Agency</Text>
              <Text type="text1">{configuration?.agency || "Missing 😔"}</Text>
            </div>
            <div>
              <Text type="text4">Profile</Text>
              <Text type="text1">{profile || "None 😔"}</Text>
            </div>
          </div>

          <hr className={styles.divider} />

          {authenticated && (
            <div className={styles.user}>
              <div className={styles.name}>
                <Text type="text4">Name</Text>
                <Text type="text1">{user?.name}</Text>
              </div>
              <div className={styles.mail}>
                <Text type="text4">Mail</Text>
                <Text type="text1">{user?.mail}</Text>
              </div>
              {typeof user?.blocked !== "undefined" && (
                <div className={styles.blocked}>
                  <Text type="text4">Blocked</Text>
                  <Text type="text1">{JSON.stringify(user?.blocked)}</Text>
                </div>
              )}
              {user?.municipalityAgencyId && (
                <div className={styles.municipalityAgencyId}>
                  <Text type="text4">MunicipalityAgencyId</Text>
                  <Text type="text1">{user?.municipalityAgencyId}</Text>
                </div>
              )}
              <div className={styles.agencies}>
                <Text type="text4">Agencies</Text>
                {user.agencies.map((a, i) => (
                  <Text as="span" type="text1">
                    {a.agencyId + " "}
                  </Text>
                ))}
              </div>

              <div className={styles.notes}>
                <Text type="text4">Agencies</Text>
                {user.agencies.map((a, i) => (
                  <Text as="span" type="text1">
                    {a.agencyId + " "}
                  </Text>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className={styles.bottom}>
          <hr />
          <div className={styles.buttons}>
            <Button
              className={styles.remove}
              size="small"
              onClick={() => {
                removeHistoryItem(token, profile);
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
              onClick={() => setSelectedToken(token, profile)}
              primary
            >
              {inUse ? "I'm in use" : "Use"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Collapse in={!removed} id={`container-collapse-${token}`}>
      <Col xs={12} className={``}>
        <Row>
          <Col xs={12} className={styles.display}>
            <Text type="text4">
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

          {!isExpired && (!agency || !profile) && (
            <Col xs={12} className={styles.error}>
              <Text type="text1">
                😬 This token has missing client configuration!
              </Text>
            </Col>
          )}

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

          <Col xs={12} className={styles.details}>
            <Row>
              <Col xs={6}>
                <Text type="text4">Agency</Text>
                <Text type="text1">{agency || "Missing 😔"}</Text>
              </Col>
              <Col xs={6}>
                <Text type="text4">Profile</Text>
                <Text type="text1">{profile || "None 😔"}</Text>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row>
          <hr />
          <Col className={styles.buttons}>
            <Button
              className={styles.remove}
              size="small"
              onClick={() => {
                removeHistoryItem(token, profile);
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
                setSelectedToken(token, profile);
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
    return <ItemIsLoading />;
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
  }, [modal.isVisible, history]);

  return (
    <Row className={styles.configurations}>
      {!state?.length && <span>You have no configurations yet 🥹 ...</span>}
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
  );
}

export default History;
