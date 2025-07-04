/**
 * @file Shows a history of the used tokens
 */

import { useState, useEffect, useRef } from "react";
import { Row } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useUser from "@/hooks/useUser";

import { dateConverter, timeConverter, daysBetween } from "@/components/utils";
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
  const days = daysBetween(date, new Date());

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

function Item({
  token,
  profile,
  note: _note,
  timestamp,
  inUse,
  configuration,
  user,
  configurationStatus,
}) {
  const { setSelectedToken, setHistoryItem, removeHistoryItem } = useStorage();

  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [distance, setDistance] = useState(false);
  const [isScrolled, setIsScrolled] = useState(null);
  const [note, setNote] = useState(_note);

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId;
  const isAuthenticated = user?.isAuthenticated;
  const hasCulrAccount = user?.hasCulrUniqueId;
  const missingConfiguration = !profile || !configuration?.agency;
  const submitted = {
    date: dateConverter(timestamp),
    time: timeConverter(timestamp),
  };

  const expires = {
    date: dateConverter(configuration?.expires),
    time: timeConverter(configuration?.expires),
  };

  const hasValidationError = configurationStatus !== "OK";

  const modal = document.getElementById("modal");
  const containerScrollY = modal?.scrollTop;

  const agencies = user?.agencies;

  const hasOmittedCulrData = user?.omittedCulrData;

  const inUseClass = inUse ? styles.inUse : "";
  const expiredClass = hasValidationError ? styles.expired : "";
  const missingConfigClass = missingConfiguration ? styles.missingConfig : "";
  const exapandedClass = open ? styles.expanded : "";
  const exapandedClassGlobal = open ? "expanded" : "";
  const removedClass = removed ? styles.removed : "";

  const expireStatusClass = getExpirationClass(configuration?.expires);

  const isScrolledClass = isScrolled ? styles.scrolled : "";

  const elRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    function handleScroll(e) {
      const isTop = e.target.scrollTop === 0;
      if (isTop !== isScrolled) {
        setIsScrolled(!isTop);
      }
    }

    const el = scrollRef.current;

    if (el) {
      el.addEventListener("scroll", handleScroll);
      () => el.removeEventListener("scroll", handleScroll);
    }
  }, [scrollRef.current]);

  useEffect(() => {
    if (elRef.current?.offsetTop + 2) {
      // + 2 is the expiration status border (not included in the offsetTop)
      setDistance(elRef.current.offsetTop + 2);
    }
  }, [elRef.current?.offsetTop]);

  return (
    <div
      ref={elRef}
      className={`${styles.item} ${expiredClass} ${expireStatusClass} ${inUseClass} ${exapandedClass} ${exapandedClassGlobal} ${isScrolledClass} ${missingConfigClass} ${removedClass}`}
    >
      <div
        className={styles.content}
        style={{
          top: open ? `${containerScrollY}px` : `${distance}px`,
        }}
      >
        <div className={styles.display}>
          {removed || hasValidationError ? (
            <div>
              {removed ? (
                <Text type="text4">This token was removed 🗑️</Text>
              ) : (
                (configurationStatus === "INVALID" && (
                  <Text type="text4">This token is invalid 🧐</Text>
                )) ||
                (configurationStatus === "EXPIRED" && (
                  <Text type="text4">This token is expired 😔</Text>
                )) || <Text type="text4">Error validating token 🤔</Text>
              )}
              <Text type="text1">{token}</Text>
            </div>
          ) : (
            <>
              <Text type={open ? "text6" : "text4"}>{displayName}</Text>

              <Text className={styles.authentication}>
                {`This token is ${
                  isAuthenticated ? "AUTHENTICATED" : "ANONYMOUS"
                }`}
                {isAuthenticated && (
                  <span> 🧑 {!hasCulrAccount && <i>⚠️</i>}</span>
                )}
              </Text>

              {missingConfiguration && (
                <Text type="text4" className={styles.missingConfigWarn}>
                  Client has missing configuration 😵‍💫
                </Text>
              )}

              <ExpandButton onClick={() => setOpen(!open)} open={open} />

              {note && <Text className={styles.note}>{note}</Text>}
            </>
          )}
        </div>
        <div className={styles.collapsed} ref={scrollRef}>
          <div className={styles.note}>
            <label htmlFor={`input-note-${token}`}>✏️</label>
            <input
              id={`input-note-${token}`}
              value={note}
              disabled={!open}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.keyCode === 13) {
                  const el = document.getElementById(`input-note-${token}`);
                  el.blur();
                }
              }}
              autoComplete="off"
              maxLength="50"
              placeholder={open ? " Some token note ..." : false}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => setHistoryItem({ token, profile, note })}
            />
          </div>

          <hr className={styles.divider} />

          <div className={styles.user}>
            <div className={styles.heading}>
              <Text type="text1">Token details</Text>
            </div>

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
          </div>

          <hr className={styles.divider} />

          <div className={styles.user}>
            <div className={styles.heading}>
              <Text type="text1">Client details</Text>
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
                <Text type="text1">
                  {profile || "None 😵‍💫"} {profile === "none" && "⚠️"}
                </Text>
              </div>
            </div>
          </div>

          {isAuthenticated && <hr className={styles.divider} />}

          {isAuthenticated && (
            <div className={styles.user}>
              <div className={styles.heading}>
                <Text type="text1">User informations</Text>
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

              {user?.municipalityAgencyId && (
                <div className={styles.municipalityAgencyId}>
                  <Text type="text4">MunicipalityAgencyId</Text>
                  <Text type="text1">{user?.municipalityAgencyId}</Text>
                </div>
              )}

              <div className={styles.details}>
                <div className={styles.isCPRValidated}>
                  <Text type="text4">IsCPRValidated</Text>
                  <Text type="text1">{user?.isCPRValidated.toString()}</Text>
                </div>

                <div className={styles.culr}>
                  <Text type="text4">HasCulrUniqueId</Text>
                  <Text type="text1">{`${hasCulrAccount.toString()} ${
                    !hasCulrAccount ? " ⚠️" : ""
                  }`}</Text>
                </div>
              </div>

              {agencies?.length > 0 && (
                <div className={styles.agencies}>
                  <Text type="text4">Token user agencies</Text>
                  {agencies?.map((agencyId, i) => {
                    return (
                      <div key={`${agencyId}-${i}`} className={styles.list}>
                        <Text as="span" type="text1">
                          {agencyId}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {isAuthenticated && <hr className={styles.divider} />}

          {isAuthenticated && (
            <div className={styles.user}>
              <div className={styles.heading}>
                <Text type="text1">Login details</Text>
              </div>

              <div className={styles.details}>
                {user?.loggedInBranchId && (
                  <div className={styles.loggedInBranchId}>
                    <Text type="text4">LoggedInBranchId</Text>
                    <Text type="text1">{user?.loggedInBranchId}</Text>
                  </div>
                )}
                {user?.loggedInAgencyId && (
                  <div className={styles.loggedInAgencyId}>
                    <Text type="text4">LoggedInAgencyId</Text>
                    <Text type="text1">{user?.loggedInAgencyId}</Text>
                  </div>
                )}
              </div>
              {user?.identityProviderUsed && (
                <div className={styles.i}>
                  <Text type="text4">IdentityProviderUsed</Text>
                  <Text type="text1">{user?.identityProviderUsed}</Text>
                </div>
              )}
            </div>
          )}

          {hasOmittedCulrData && <hr className={styles.divider} />}

          {hasOmittedCulrData && (
            <div className={styles.user}>
              <div className={styles.heading}>
                <Text type="text1">Omitted Culr data</Text>
              </div>

              <div className={styles.details}>
                <div className={styles.hasOmittedCulrUniqueId}>
                  <Text type="text4">UniqueId</Text>
                  <Text type="text1">
                    {hasOmittedCulrData?.hasOmittedCulrUniqueId.toString()}
                  </Text>
                </div>

                <div className={styles.culr}>
                  <Text type="text4">Accounts</Text>
                  <Text type="text1">
                    {hasOmittedCulrData?.hasOmittedCulrAccounts.toString()}
                  </Text>
                </div>
              </div>

              <div className={styles.details}>
                <div className={styles.isCPRValidated}>
                  <Text type="text4">Municipality</Text>
                  <Text type="text1">
                    {hasOmittedCulrData?.hasOmittedCulrMunicipality.toString()}
                  </Text>
                </div>

                <div className={styles.culr}>
                  <Text type="text4">MunicipalityAgencyId</Text>
                  <Text type="text1">
                    {hasOmittedCulrData?.hasOmittedCulrMunicipalityAgencyId.toString()}
                  </Text>
                </div>
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
              disabled={hasValidationError}
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
  const { configuration, status, isLoading } = useConfiguration(props);
  const { user } = useUser(props);

  if (isLoading) {
    return <ItemIsLoading />;
  }

  return (
    <Item
      {...props}
      user={user}
      configuration={configuration}
      configurationStatus={status}
    />
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
  const noConfigurationsClass = state?.length ? "" : styles.noConfigurations;

  return (
    <Row
      className={`${styles.configurations} ${noConfigurationsClass} ${isScrolledClass}`}
    >
      {!state?.length && <span>You have no configurations yet 🥹</span>}
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
