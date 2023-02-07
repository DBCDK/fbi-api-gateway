import { useState, useEffect, useRef } from "react";
import { Row } from "react-bootstrap";
import uniqBy from "lodash/uniqBy";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import { dateConverter, timeConverter, toTimestamp } from "@/components/utils";
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import { isEqual } from "@/components/utils";

import styles from "./History.module.css";

/**
 * Expiration status
 *
 * @param {string} expirationdate
 * See propTypes for specific props and types
 *
 * @returns {obj}
 */
function getExpirationClass(date) {
  const expires = toTimestamp(date);
  const now = toTimestamp(new Date());
  const diff = expires - now;

  const days = Math.ceil(diff / (1000 * 3600 * 24)) || 0;

  if (days < 5) {
    return styles["expire-less-than-5-days"];
  }

  if (days < 15) {
    return styles["expire-less-than-15-days"];
  }

  if (days >= 15) {
    return styles["expire-more-or-eq-to-15-days"];
  }

  return "";
}

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

function Item({ token, profile, timestamp, inUse, configuration, isExpired }) {
  const { setSelectedToken, removeHistoryItem } = useStorage();

  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [distance, setDistance] = useState(false);

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId;
  const authenticated = !!configuration?.uniqueId;
  const missingConfiguration = !profile || !configuration.agency;
  const submitted = {
    date: dateConverter(timestamp),
    time: timeConverter(timestamp),
  };
  const expires = {
    date: dateConverter(configuration?.expires),
    time: timeConverter(configuration?.expires),
  };

  const modal = document.getElementById("modal");
  const containerScrollY = modal?.scrollTop;

  const user = configuration.user;

  const agencies = uniqBy(user?.agencies, "agencyId");

  const inUseClass = inUse ? styles.inUse : "";
  const expiredClass = isExpired ? styles.expired : "";
  const missingConfigClass = missingConfiguration ? styles.missingConfig : "";
  const exapandedClass = open ? styles.expanded : "";
  const exapandedClassGlobal = open ? "expanded" : "";
  const removedClass = removed ? styles.removed : "";

  const expireStatusClass = getExpirationClass(configuration?.expires);

  const elRef = useRef();

  useEffect(() => {
    if (elRef.current?.offsetTop + 2) {
      // + 2 is the expiration status border (not included in the offsetTop)
      setDistance(elRef.current.offsetTop + 2);
    }
  }, [elRef.current?.offsetTop]);

  return (
    <div
      ref={elRef}
      className={`${styles.item} ${expiredClass} ${expireStatusClass} ${inUseClass} ${exapandedClass} ${exapandedClassGlobal} ${missingConfigClass} ${removedClass}`}
    >
      <div
        className={styles.content}
        style={{
          top: open ? `${containerScrollY}px` : `${distance}px`,
        }}
      >
        <div className={styles.display}>
          {removed || isExpired ? (
            <div>
              {removed ? (
                <Text type="text4">This token was removed 🗑️</Text>
              ) : (
                <Text type="text4">This token is expired 😔</Text>
              )}
              <Text type="text1">{token}</Text>
            </div>
          ) : (
            <>
              <Text type={open ? "text6" : "text4"} className={styles.display}>
                {displayName}
              </Text>
              <Text className={styles.authentication}>
                {`This token is ${
                  authenticated ? "AUTHENTICATED 🧑" : "ANONYMOUS"
                }`}
              </Text>

              {missingConfiguration && (
                <Text type="text4" className={styles.missingConfigWarn}>
                  Client has missing configuration 😵‍💫
                </Text>
              )}

              <ExpandButton onClick={() => setOpen(!open)} open={open} />
            </>
          )}
        </div>
        <div className={styles.collapsed}>
          <div className={styles.submitted}>
            <Text type="text4">Submitted at</Text>
            <Text type="text1">
              {submitted.date} <span>{submitted.time}</span>
            </Text>
          </div>

          <div className={`${styles.expires} `}>
            <Text type="text4">Expiration date</Text>
            <div>
              <i className={`${styles.indicator} ${expireStatusClass}`} />
              <Text type="text1">
                {expires.date}
                <span>{expires.time}</span>
              </Text>
            </div>
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
              <Text type="text1">
                {configuration?.agency || "Missing 😵‍💫"}
              </Text>
            </div>
            <div>
              <Text type="text4">Profile</Text>
              <Text type="text1">{profile || "None 😵‍💫"}</Text>
            </div>
          </div>

          {authenticated && user && <hr className={styles.divider} />}

          {authenticated && user && (
            <div className={styles.user}>
              <div className={styles.heading}>
                <Text type="text1">Token user details</Text>
              </div>

              {user?.name && (
                <div className={styles.name}>
                  <Text type="text4">Name</Text>
                  <Text type="text1">{user?.name}</Text>
                </div>
              )}
              {user?.mail && (
                <div className={styles.mail}>
                  <Text type="text4">Mail</Text>
                  <Text type="text1">{user?.mail}</Text>
                </div>
              )}
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
              {agencies?.length > 0 && (
                <div className={styles.agencies}>
                  <Text type="text4">User agencies</Text>
                  {agencies?.map((a, i) => (
                    <Text as="span" key={`${a.agencyId}-${i}`} type="text1">
                      {a.agencyId + " "}
                    </Text>
                  ))}
                </div>
              )}
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
                setOpen(false);
                const delay = open ? 500 : 0;
                setTimeout(() => setRemoved(true), delay);
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

function History({ modal }) {
  const { history, selectedToken } = useStorage();
  const [state, setState] = useState(history);
  const [isScrolled, setIsScrolled] = useState(null);

  // update history on modal close
  useEffect(() => {
    if (!modal.isVisible) {
      setTimeout(() => setState(history), 200);
    }
  }, [modal.isVisible, history]);

  useEffect(() => {
    function handleScroll(e) {
      const isTop = e.target.scrollTop === 0;
      if (isTop !== isScrolled) {
        setIsScrolled(!isTop);
      }
    }

    const body = document.getElementById("modal");

    if (body) {
      body.addEventListener("scroll", handleScroll, { passive: true });
      () => body.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const isScrolledClass = isScrolled ? "scrolled" : "";

  return (
    <Row className={`${styles.configurations} ${isScrolledClass}`}>
      {!state?.length && <span>You have no configurations yet 🥹 ...</span>}
      {state?.map((h, i) => {
        return (
          <Wrap
            key={`${h.token}-${i}`}
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
