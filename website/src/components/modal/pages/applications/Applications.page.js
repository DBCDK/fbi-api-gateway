/**
 * @file Shows the connected applications and credentials
 */

import { useState, useEffect, useRef } from "react";
import { Col, Row } from "react-bootstrap";

import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";
import useCredentialResolve from "@/hooks/credentials/useCredentialResolve";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import { MAX_CLIENT_ENTRIES as MAX_APPLICATION_ENTRIES } from "@/utils/clientEntries";
import {
  detectCredentialType,
  EASTER_EGG_CREDENTIAL_ID,
  EASTER_EGG_DISPLAY_NAME,
} from "@/utils/credentials";

import Overlay from "@/components/base/overlay";
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import ApplicationItem from "./item";

import styles from "./Applications.module.css";

const MIN_PENDING_DURATION_MS = 1000;
const MODAL_CLOSE_REORDER_DELAY_MS = 300;
const PERSONAL_BEST_STORAGE_KEY = "resolve-runner-personal-best";

function prioritizeEasterEgg(entries = []) {
  const runnerEntries = entries.filter(
    (entry) => entry?.type === "easteregg" || entry?.id === EASTER_EGG_CREDENTIAL_ID
  );
  const regularEntries = entries.filter(
    (entry) => entry?.type !== "easteregg" && entry?.id !== EASTER_EGG_CREDENTIAL_ID
  );

  return [...runnerEntries, ...regularEntries];
}

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */

function ApplicationsPage({ modal }) {
  const { applications, setCredentialEntry: setApplicationEntry, removeCredentialEntry: removeApplicationEntry } =
    useCredentialEntries();
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { selectCredential: setSelectedToken } = useCredentialMutations();
  const { resolveCredential } = useCredentialResolve();
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const [state, setState] = useState(applications);
  const [isScrolled, setIsScrolled] = useState(null);
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const [filter, setFilter] = useState("");
  const [inputError, setInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshCycle, setRefreshCycle] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const previousModalVisibleRef = useRef(modal.isVisible);
  const closeReorderTimeoutRef = useRef(null);

  function getActiveEasterEggEntry() {
    if (selectedToken?.type !== "easteregg") {
      return null;
    }

    let personalBestScore = 0;
    let personalBestDistance = 0;

    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(PERSONAL_BEST_STORAGE_KEY);

        if (saved) {
          const parsed = JSON.parse(saved);
          personalBestScore = Number.isFinite(parsed?.score) ? parsed.score : 0;
          personalBestDistance = Number.isFinite(parsed?.distance)
            ? parsed.distance
            : 0;
        }
      } catch {}
    }

    return {
      id: EASTER_EGG_CREDENTIAL_ID,
      type: "easteregg",
      token: selectedToken.token,
      clientId: "resolve-runner",
      profile: selectedToken.profile || EASTER_EGG_DISPLAY_NAME,
      agency: selectedToken.agency || "resolve-runner",
      note: EASTER_EGG_DISPLAY_NAME,
      personalBestScore,
      personalBestDistance,
    };
  }

  function withActiveEasterEgg(entries = []) {
    const activeEasterEggEntry = getActiveEasterEggEntry();
    const filteredEntries = entries.filter(
      (entry) => entry?.type !== "easteregg" && entry?.id !== EASTER_EGG_CREDENTIAL_ID
    );

    if (!activeEasterEggEntry) {
      return filteredEntries;
    }

    return [activeEasterEggEntry, ...filteredEntries].slice(
      0,
      MAX_APPLICATION_ENTRIES
    );
  }

  function getEntryIdentifier(entry) {
    if (!entry) {
      return null;
    }

    return entry.clientId
      ? `client:${entry.clientId}`
      : entry.id || entry.token || null;
  }

  function isSelectedApplication(selectedEntry, applicationEntry) {
    if (!selectedEntry || !applicationEntry) {
      return false;
    }

    const selectedIdentifier = getEntryIdentifier(selectedEntry);
    const applicationIdentifier = getEntryIdentifier(applicationEntry);
    const hasSameIdentity =
      (selectedIdentifier &&
        applicationIdentifier &&
        selectedIdentifier === applicationIdentifier) ||
      (selectedEntry.id &&
        applicationEntry.id &&
        selectedEntry.id === applicationEntry.id) ||
      (selectedEntry.token &&
        applicationEntry.token &&
        selectedEntry.token === applicationEntry.token);

    if (!hasSameIdentity) {
      return false;
    }

    if (
      selectedEntry.profile &&
      applicationEntry.profile &&
      selectedEntry.profile !== applicationEntry.profile
    ) {
      return false;
    }

    if (
      selectedEntry.agency &&
      applicationEntry.agency &&
      selectedEntry.agency !== applicationEntry.agency
    ) {
      return false;
    }

    return true;
  }

  function isTransientEntry(entry) {
    return Boolean(
      entry?.isPending ||
        entry?.status === "ERROR" ||
        entry?.status === "INVALID"
    );
  }

  function mergeApplicationsIntoCurrentOrder(current, nextApplications) {
    const nextByIdentifier = new Map(
      nextApplications.map((entry) => [getEntryIdentifier(entry), entry])
    );
    const transientEntries = current.filter((entry) => {
      if (!isTransientEntry(entry)) {
        return false;
      }

      const identifier = getEntryIdentifier(entry);
      return !nextByIdentifier.has(identifier);
    });
    const preservedEntries = current
      .map((entry) => {
        const identifier = getEntryIdentifier(entry);

        if (!identifier || isTransientEntry(entry)) {
          return null;
        }

        return nextByIdentifier.get(identifier) || null;
      })
      .filter(Boolean);
    const preservedIdentifiers = new Set(
      preservedEntries.map((entry) => getEntryIdentifier(entry))
    );
    const newEntries = nextApplications.filter((entry) => {
      const identifier = getEntryIdentifier(entry);
      return identifier && !preservedIdentifiers.has(identifier);
    });

    return [...transientEntries, ...preservedEntries, ...newEntries].slice(
      0,
      MAX_APPLICATION_ENTRIES
    );
  }

  function areApplicationListsEqual(current = [], next = []) {
    if (current === next) {
      return true;
    }

    if (current.length !== next.length) {
      return false;
    }

    return current.every((entry, index) => {
      const nextEntry = next[index];

      return (
        getEntryIdentifier(entry) === getEntryIdentifier(nextEntry) &&
        entry?.id === nextEntry?.id &&
        entry?.token === nextEntry?.token &&
        entry?.clientId === nextEntry?.clientId &&
        entry?.status === nextEntry?.status &&
        entry?.message === nextEntry?.message &&
        entry?.note === nextEntry?.note &&
        entry?.inUse === nextEntry?.inUse &&
        entry?.isPending === nextEntry?.isPending &&
        entry?.isEntering === nextEntry?.isEntering &&
        entry?.isRemoving === nextEntry?.isRemoving &&
        entry?.profile === nextEntry?.profile &&
        entry?.agency === nextEntry?.agency &&
        entry?.hasClientSecret === nextEntry?.hasClientSecret &&
        entry?.networkSetting === nextEntry?.networkSetting
      );
    });
  }

  function createPendingEntry(value) {
    const normalizedValue = typeof value === "string" ? value.trim() : "";
    const type = detectCredentialType(normalizedValue);

    if (!type) {
      return null;
    }

    return {
      id: `${type}:${normalizedValue}`,
      type,
      token: type === "token" ? normalizedValue : null,
      clientId: type === "client" ? normalizedValue : null,
      isEntering: true,
      timestamp: Date.now(),
      note: "",
      message:
        type === "client"
          ? "Resolving client configuration..."
          : "Validating token...",
      isPending: true,
    };
  }

  function withCurrentNetworkSetting(entry) {
    if (!entry) {
      return entry;
    }

    return {
      ...entry,
      networkSetting: internalNetworkCheck,
    };
  }

  function createErroredEntry(value, message) {
    const normalizedValue = typeof value === "string" ? value.trim() : "";
    const type = detectCredentialType(normalizedValue);

    if (!type) {
      return null;
    }

    return {
      id: `${type}:${normalizedValue}`,
      type,
      token: type === "token" ? normalizedValue : null,
      clientId: type === "client" ? normalizedValue : null,
      timestamp: Date.now(),
      note: "",
      status: type === "token" ? "INVALID" : "ERROR",
      message: message || "Credential could not be resolved",
    };
  }

  function syncStateWithEntry(entry) {
    const identifier = getEntryIdentifier(entry);

    if (!identifier) {
      return;
    }

    setState((current) => {
      const filtered = current.filter((item) => {
        const itemIdentifier = getEntryIdentifier(item);
        return itemIdentifier !== identifier;
      });

      return [entry, ...filtered].slice(0, MAX_APPLICATION_ENTRIES);
    });
  }

  function removeStateEntry(entry) {
    const identifier = getEntryIdentifier(entry);

    if (!identifier) {
      return;
    }

    setState((current) =>
      current.filter((item) => {
        const itemIdentifier = getEntryIdentifier(item);
        return itemIdentifier !== identifier;
      })
    );
  }

  function markStateEntryAsRemoving(entry) {
    const identifier = getEntryIdentifier(entry);

    if (!identifier) {
      return;
    }

    setState((current) =>
      current.map((item) => {
        const itemIdentifier = getEntryIdentifier(item);

        if (itemIdentifier !== identifier) {
          return item;
        }

        return {
          ...item,
          isRemoving: true,
        };
      })
    );
  }

  function handleRemoveEntry(entry) {
    markStateEntryAsRemoving(entry);

    window.setTimeout(() => {
      removeApplicationEntry(entry);
      removeStateEntry(entry);
    }, 280);
  }

  async function ensurePendingDuration(startedAt) {
    if (!startedAt) {
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = MIN_PENDING_DURATION_MS - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setInputError("");
    const inputType = detectCredentialType(filter);

    if (!inputType) {
      setInputError("🧐 Invalid input");
      return;
    }

    if (inputType === "client") {
      const normalizedClientId = filter.trim();
      const existingEntry = applications?.find?.(
        (item) => item?.clientId === normalizedClientId
      );

      if (existingEntry) {
        // Re-resolve existing clients without an attached clientSecret so they
        // can pick up the current network setting instead of stale state.
        if (existingEntry.clientSecret || existingEntry.hasClientSecret) {
          const nextEntry = withCurrentNetworkSetting(existingEntry);

          setApplicationEntry(nextEntry, false);
          syncStateWithEntry(nextEntry);

          if (nextEntry.token) {
            setSelectedToken(
              nextEntry.token,
              nextEntry.profile,
              nextEntry.agency,
              {
                id: nextEntry.id,
                type: nextEntry.type,
                clientId: nextEntry.clientId,
                hasClientSecret: nextEntry.hasClientSecret,
              }
            );
          }

          setFilter("");
          return;
        }
      }
    }

    const pendingEntry = createPendingEntry(filter);
    const pendingStartedAt = pendingEntry ? Date.now() : null;
    const normalizedClientId = inputType === "client" ? filter.trim() : null;
    const existingEntry =
      inputType === "client"
        ? applications?.find?.((item) => item?.clientId === normalizedClientId) ||
          null
        : applications?.find?.((item) => item?.token === filter.trim()) || null;

    if (
      !existingEntry &&
      (applications?.length || 0) >= MAX_APPLICATION_ENTRIES
    ) {
      setInputError(`Max ${MAX_APPLICATION_ENTRIES} applications.`);
      return;
    }

    if (pendingEntry) {
      syncStateWithEntry(pendingEntry);
    }

    setIsSubmitting(true);

    const response = await resolveCredential({
      value: filter,
      entryId: existingEntry?.id || undefined,
    });

    if (response?.safeEntry) {
      await ensurePendingDuration(pendingStartedAt);

      if (pendingEntry) {
        removeStateEntry(pendingEntry);
      }

      const nextEntry = withCurrentNetworkSetting(response.safeEntry);

      setApplicationEntry(nextEntry, false);
      syncStateWithEntry(nextEntry);

      if (nextEntry.token) {
        setSelectedToken(nextEntry.token, nextEntry.profile, nextEntry.agency, {
          id: nextEntry.id,
          type: nextEntry.type,
          clientId: nextEntry.clientId,
          hasClientSecret: nextEntry.hasClientSecret,
        });
      }

      setFilter("");
      if (inputType !== "client") {
        setIsAddExpanded(false);
      }
      return;
    }

    if (pendingEntry) {
      await ensurePendingDuration(pendingStartedAt);

      const erroredEntry = createErroredEntry(
        filter,
        response?.message || "Credential could not be resolved"
      );

      if (erroredEntry) {
        syncStateWithEntry(erroredEntry);
      } else {
        removeStateEntry(pendingEntry);
      }
    }

    setIsSubmitting(false);
  }

  useEffect(() => {
    if (isSubmitting && !state.some((entry) => entry?.isPending)) {
      setIsSubmitting(false);
    }
  }, [isSubmitting, state]);

  useEffect(() => {
    if (modal.isVisible && !previousModalVisibleRef.current) {
      window.clearTimeout(closeReorderTimeoutRef.current);
      setRefreshCycle((current) => current + 1);
    }

    if (
      !modal.isVisible &&
      previousModalVisibleRef.current &&
      selectedToken?.token
    ) {
      closeReorderTimeoutRef.current = window.setTimeout(() => {
        setApplicationEntry(selectedToken, false);
        closeReorderTimeoutRef.current = null;
      }, MODAL_CLOSE_REORDER_DELAY_MS);
    }

    previousModalVisibleRef.current = modal.isVisible;
  }, [modal.isVisible, selectedToken, setApplicationEntry]);

  useEffect(
    () => () => {
      window.clearTimeout(closeReorderTimeoutRef.current);
    },
    []
  );

  useEffect(() => {
    setState((current) => {
      const effectiveApplications = withActiveEasterEgg(applications);
      const nextState = modal.isVisible
        ? mergeApplicationsIntoCurrentOrder(current, effectiveApplications)
        : [
            ...current.filter((entry) => {
              if (!isTransientEntry(entry)) {
                return false;
              }

              const identifier = getEntryIdentifier(entry);

              return !effectiveApplications.some(
                (applicationEntry) =>
                  getEntryIdentifier(applicationEntry) === identifier
              );
            }),
            ...effectiveApplications,
          ].slice(0, MAX_APPLICATION_ENTRIES);

      return areApplicationListsEqual(current, nextState) ? current : nextState;
    });
  }, [applications, modal.isVisible, selectedToken]);

  useEffect(() => {
    if (!isAddExpanded) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [isAddExpanded]);

  useEffect(() => {
    if (modal.isVisible && modal.openAddOnShow) {
      setIsAddExpanded(true);
    }
  }, [modal.isVisible, modal.openAddOnShow]);

  // reset local view when modal closes
  useEffect(() => {
        if (!modal.isVisible) {
      setIsAddExpanded(false);
      setFilter("");
      setInputError("");
        setTimeout(() => {
          setState((current) =>
          areApplicationListsEqual(current, withActiveEasterEgg(applications))
            ? current
            : withActiveEasterEgg(applications)
        );
      }, 200);
    }
  }, [modal.isVisible, applications, selectedToken]);

  useEffect(() => {
    function handleScroll(e) {
      const isTop = e.target.scrollTop === 0;
      setIsScrolled((current) => (current === !isTop ? current : !isTop));
    }

    const body = document.getElementById("modal");

    if (body) {
      body.addEventListener("scroll", handleScroll, { passive: true });

      return () => body.removeEventListener("scroll", handleScroll);
    }
    return undefined;
  }, []);

  const isScrolledClass = isScrolled ? "scrolled" : "";
  const noConfigurationsClass = state?.length ? "" : styles.noConfigurations;
  const expandedClass = isAddExpanded ? styles.expanded : "";
  const orderedState = prioritizeEasterEgg(state);

  return (
    <Row
      className={`${styles.configurations} ${noConfigurationsClass} ${isScrolledClass}`}
    >
      <Col xs={12} className={`${styles.top} ${expandedClass}`}>
        <Text type="text4" className={styles.title}>
          {isAddExpanded ? "Add new application" : "Your applications"}
        </Text>

        <Text type="text0" className={styles.text}>
          Add <strong>clientId</strong> or <strong>token</strong> to connect
          your app
        </Text>

        <button
          type="button"
          onClick={() => {
            if (isAddExpanded) {
              setIsAddExpanded(false);
              return;
            }

            modal.onHide?.();
          }}
          className={styles.closeIcon}
          aria-label={
            isAddExpanded ? "Close add application" : "Close applications"
          }
        >
          <span className={styles.closeGlyph} aria-hidden="true" />
        </button>

        <div className={styles.addContainer}>
          <div className={styles.wrap}>
            <div className={styles.breakout}></div>

            <Button
              className={styles.add}
              primary
              size="small"
              onClick={() => setIsAddExpanded(true)}
              tabIndex={isAddExpanded ? "-1" : "0"}
            >
              <span className={styles.addButtonContent}>
                <span className={styles.plusIcon} aria-hidden="true" />
                <Text type="text4">Add</Text>
              </span>
            </Button>
            <form
              ref={containerRef}
              className={styles.form}
              onSubmit={(e) => handleSubmit(e)}
            >
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Drop clientId og token to connect ..."
                value={filter}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                tabIndex={isAddExpanded ? 0 : -1}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setInputError("");
                }}
              />
              <button
                className={styles.submit}
                type="submit"
                disabled={!filter || filter === "" || isSubmitting}
                aria-busy={isSubmitting}
                tabIndex={isAddExpanded ? 0 : -1}
              >
                <span className={styles.submitGlyph} aria-hidden="true" />
              </button>
            </form>
            <Overlay
              className={styles.overlay}
              show={Boolean(inputError)}
              container={containerRef}
              popperConfig={{
                strategy: "fixed",
              }}
            >
              <Text type="text2">{inputError}</Text>
            </Overlay>
          </div>
        </div>
      </Col>
      <Col xs={12} className={styles.list}>
        {!orderedState?.length && <span>You have no applications yet 🥹</span>}
        {orderedState?.map((h, i) => {
          return (
            <ApplicationItem
              key={h.id || `${h.token}-${i}`}
              isVisible={modal.isVisible}
              refreshCycle={refreshCycle}
              inUse={isSelectedApplication(selectedToken, h)}
              onRemoveRequest={handleRemoveEntry}
              {...h}
            />
          );
        })}
      </Col>
    </Row>
  );
}

export default ApplicationsPage;
