import { useState, useEffect, useRef } from "react";

import useConfiguration from "@/hooks/useConfiguration";
import useCredentialConfiguration from "@/hooks/useCredentialConfiguration";
import useCredentialResolve from "@/hooks/useCredentialResolve";
import useCredentialUser from "@/hooks/useCredentialUser";
import useStorage from "@/hooks/useStorage";
import useUser from "@/hooks/useUser";

import { dateConverter, timeConverter, daysBetween } from "@/components/utils";
import { hasAvailableAgency } from "@/utils/configuration";
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import ExpandButton from "./expand-button/ExpandButton";
import ItemClientSecretForm from "./item-client-secret-form";
import ItemExpandedDetails from "./item-expanded-details";
import styles from "./Item.module.css";

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

function hasData(value) {
  return Boolean(value && Object.keys(value).length > 0);
}

function ItemContent({
  id,
  type = "token",
  token,
  clientId: initialClientId,
  profile,
  agency,
  note: initialNote,
  timestamp,
  inUse,
  configuration = {},
  user = {},
  configurationStatus,
  requiresClientSecret = false,
  hasClientSecret = false,
  message,
  reveal = false,
  isEntering = false,
  isRemoving = false,
  onRemoveRequest,
  mutateCredentialConfiguration,
  mutateCredentialUser,
}) {
  const { setSelectedToken, setHistoryItem, removeHistoryItem } = useStorage();
  const { resolveCredential } = useCredentialResolve();

  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(null);
  const [note, setNote] = useState(initialNote);
  const [clientSecret, setClientSecret] = useState("");
  const [clientSecretError, setClientSecretError] = useState("");
  const [containerScrollY, setContainerScrollY] = useState(0);

  const displayName = configuration?.displayName;
  const clientId = configuration?.clientId || initialClientId;
  const isAuthenticated = user?.isAuthenticated;
  const hasCulrAccount = user?.hasCulrUniqueId;

  const submitted = {
    date: dateConverter(timestamp),
    time: timeConverter(timestamp),
  };

  const needsClientSecret =
    requiresClientSecret || configurationStatus === "CLIENT_SECRET_REQUIRED";
  const shouldShowInlineClientSecretForm = needsClientSecret;
  const shouldShowExpandedClientSecretForm =
    type === "client" && !needsClientSecret && !hasClientSecret;
  const canExpand = !needsClientSecret;
  const hasValidationError =
    configurationStatus !== "OK" &&
    configurationStatus !== "CLIENT_SECRET_REQUIRED";
  const missingConfiguration =
    !needsClientSecret && (!profile || !hasAvailableAgency(configuration));
  const expires = configuration?.expires
    ? {
        date: dateConverter(configuration?.expires),
        time: timeConverter(configuration?.expires),
      }
    : {
        date: "Not resolved yet",
        time: "",
      };

  const inUseClass = inUse ? styles.inUse : "";
  const expiredClass = hasValidationError ? styles.expired : "";
  const missingConfigClass = missingConfiguration ? styles.missingConfig : "";
  const exapandedClass = open ? styles.expanded : "";
  const exapandedClassGlobal = open ? "expanded" : "";
  const removedClass = removed ? styles.removed : "";
  const removingClass = isRemoving ? styles.removing : "";
  const enteringClass = isEntering ? styles.entering : "";
  const revealClass = reveal ? styles.reveal : "";

  const expireStatusClass = getExpirationClass(configuration?.expires);
  const isScrolledClass = isScrolled ? styles.scrolled : "";

  const elRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    const modal = document.getElementById("modal");

    if (!modal) {
      return undefined;
    }

    function handleModalScroll() {
      setContainerScrollY(modal.scrollTop);
    }

    handleModalScroll();
    modal.addEventListener("scroll", handleModalScroll, { passive: true });

    return () => modal.removeEventListener("scroll", handleModalScroll);
  }, []);

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

      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [isScrolled]);

  const itemOffsetTop = elRef.current?.offsetTop || 0;
  const contentTop = open ? containerScrollY - itemOffsetTop : 0;

  async function handleResolveWithClientSecret() {
    setClientSecretError("");
    const response = await resolveCredential({
      value: clientId,
      clientSecret,
      entryId: id,
      agency,
    });

    if (!response?.safeEntry?.token) {
      setClientSecretError(
        response?.message || "Could not validate clientSecret"
      );
      return;
    }

    setHistoryItem(
      {
        ...response.safeEntry,
        note,
      },
      false
    );
    setSelectedToken(
      response.safeEntry.token,
      response.safeEntry.profile,
      response.safeEntry.agency,
      {
        id: response.safeEntry.id,
        type: response.safeEntry.type,
        clientId: response.safeEntry.clientId,
      }
    );
    mutateCredentialConfiguration?.();
    mutateCredentialUser?.();
    setClientSecret("");
  }

  return (
    <div
      ref={elRef}
      className={`${styles.item} ${expiredClass} ${expireStatusClass} ${inUseClass} ${exapandedClass} ${exapandedClassGlobal} ${isScrolledClass} ${missingConfigClass} ${removedClass} ${removingClass} ${enteringClass} ${revealClass}`}
    >
      <div
        className={styles.content}
        style={{
          top: `${contentTop}px`,
        }}
      >
        <div className={styles.display}>
          {removed || hasValidationError ? (
            <div>
              {removed ? (
                <Text type="text4">This token was removed 🗑️</Text>
              ) : (
                <Text type="text4">
                  {message ||
                    (configurationStatus === "INVALID" &&
                      "This token is invalid 🧐") ||
                    (configurationStatus === "EXPIRED" &&
                      "This token is expired 😔") ||
                    "Error validating token 🤔"}
                </Text>
              )}
              <Text type="text1">{token || clientId}</Text>
            </div>
          ) : (
            <>
              <Text type={open ? "text6" : "text4"}>
                {displayName || clientId}
              </Text>

              {!needsClientSecret && token && (
                <Text className={styles.authentication}>
                  {`This token is ${
                    isAuthenticated ? "AUTHENTICATED" : "ANONYMOUS"
                  }`}
                  {isAuthenticated && (
                    <span> 🧑 {!hasCulrAccount && <i>⚠️</i>}</span>
                  )}
                </Text>
              )}

              {needsClientSecret && (
                <Text className={styles.authentication}>
                  {message || "ClientSecret is required before token exchange."}
                </Text>
              )}

              {missingConfiguration && (
                <Text type="text4" className={styles.missingConfigWarn}>
                  Client has missing configuration 😵‍💫
                </Text>
              )}

              {canExpand && (
                <ExpandButton onClick={() => setOpen(!open)} open={open} />
              )}

              {note && <Text className={styles.note}>{note}</Text>}
            </>
          )}
        </div>
        {shouldShowInlineClientSecretForm && (
          <ItemClientSecretForm
            clientSecret={clientSecret}
            clientSecretError={clientSecretError}
            setClientSecret={setClientSecret}
            showDivider={false}
            showAction={false}
          />
        )}
        <ItemExpandedDetails
          id={id}
          type={type}
          token={token}
          clientId={clientId}
          profile={profile}
          agency={agency}
          note={note}
          open={open}
          scrollRef={scrollRef}
          submitted={submitted}
          expires={expires}
          expireStatusClass={expireStatusClass}
          configuration={configuration}
          user={user}
          needsClientSecret={needsClientSecret}
          hasCulrAccount={hasCulrAccount}
          message={message}
          setNote={setNote}
          setHistoryItem={setHistoryItem}
          clientSecret={clientSecret}
          clientSecretError={clientSecretError}
          setClientSecret={setClientSecret}
          requiresClientSecret={requiresClientSecret}
          hasClientSecret={hasClientSecret}
          configurationStatus={configurationStatus}
          showClientSecretForm={shouldShowExpandedClientSecretForm}
          onClientSecretSubmit={handleResolveWithClientSecret}
        />
        <div className={styles.bottom}>
          <hr />
          <div className={styles.buttons}>
            <Button
              className={styles.remove}
              size="small"
              onClick={() => {
                setOpen(false);
                const entry = { id, token, clientId };

                if (onRemoveRequest) {
                  onRemoveRequest(entry);
                  return;
                }

                removeHistoryItem(entry);
                const delay = open ? 500 : 0;
                setTimeout(() => setRemoved(true), delay);
              }}
              secondary
            >
              Remove
            </Button>
            <Button
              className={styles.use}
              disabled={
                needsClientSecret ? !clientSecret : hasValidationError || !token
              }
              size="small"
              onClick={() => {
                if (needsClientSecret) {
                  handleResolveWithClientSecret();
                  return;
                }

                setSelectedToken(token, profile, agency, {
                  id,
                  type,
                  clientId,
                });
              }}
              primary
            >
              {needsClientSecret
                ? "Update and use"
                : inUse
                  ? "I'm in use"
                  : "Use"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemIsLoading({
  label = "",
  type = "client",
  isEntering = false,
}) {
  return (
    <div
      className={`${styles.item} ${styles.isLoading} ${
        isEntering ? styles.entering : ""
      }`}
    >
      <div className={styles.loadingMeta}></div>
    </div>
  );
}

function Item(props) {
  const [isReveal, setIsReveal] = useState(false);
  const wasPendingRef = useRef(props.isPending === true);
  const isClientEntry = props.type === "client";

  useEffect(() => {
    if (wasPendingRef.current && !props.isPending) {
      setIsReveal(true);
      const timeout = setTimeout(() => setIsReveal(false), 320);
      wasPendingRef.current = false;
      return () => clearTimeout(timeout);
    }

    wasPendingRef.current = props.isPending === true;
    return undefined;
  }, [props.isPending]);

  const {
    configuration: tokenConfiguration,
    status: tokenStatus,
    isLoading: tokenIsLoading,
  } = useConfiguration(props);
  const { user: tokenUser } = useUser(props);

  const {
    configuration: credentialConfiguration,
    status: credentialStatus,
    isLoading: credentialIsLoading,
    mutate: mutateCredentialConfiguration,
  } = useCredentialConfiguration({
    id: props.id,
    token: props.token,
    agency: props.agency,
    lookupByEntryId: isClientEntry,
  });
  const { user: credentialUser, mutate: mutateCredentialUser } =
    useCredentialUser({
      id: props.id,
      token: props.token,
      lookupByEntryId: isClientEntry,
    });

  const resolvedConfiguration = isClientEntry
    ? credentialConfiguration
    : tokenConfiguration;
  const resolvedUser = isClientEntry ? credentialUser : tokenUser;

  const configuration = hasData(resolvedConfiguration)
    ? resolvedConfiguration
    : props.configuration || {};

  const user = hasData(resolvedUser) ? resolvedUser : props.user || {};

  const configurationStatus = isClientEntry
    ? credentialStatus || props.status || "OK"
    : tokenStatus || props.status || "OK";

  const isLoading = isClientEntry ? credentialIsLoading : tokenIsLoading;

  if (props.isPending || (isLoading && (props.token || isClientEntry))) {
    return (
      <ItemIsLoading
        type={props.type}
        label={props.clientId || props.token || ""}
        isEntering={props.isEntering}
      />
    );
  }

  return (
    <ItemContent
      {...props}
      reveal={isReveal}
      user={user}
      configuration={configuration}
      configurationStatus={configurationStatus}
      mutateCredentialConfiguration={mutateCredentialConfiguration}
      mutateCredentialUser={mutateCredentialUser}
    />
  );
}

export default Item;
