/**
 * @file Shows a history of the used tokens
 */

import { useState, useEffect, useRef } from "react";
import { Col, Row } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useCredentialResolve from "@/hooks/useCredentialResolve";
import useInternalNetworkCheck from "@/hooks/useInternalNetworkCheck";
import { MAX_CLIENT_ENTRIES } from "@/utils/clientEntries";
import { detectCredentialType } from "@/utils/credentials";

import Overlay from "@/components/base/overlay";
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import { isEqual } from "@/components/utils";
import HistoryItem from "./item";

import styles from "./History.module.css";

const MIN_PENDING_DURATION_MS = 1000;

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */

function History({ modal }) {
  const {
    history,
    selectedToken,
    setHistoryItem,
    setSelectedToken,
    removeHistoryItem,
  } = useStorage();
  const { resolveCredential } = useCredentialResolve();
  const { internalNetworkCheck } = useInternalNetworkCheck();
  const [state, setState] = useState(history);
  const [isScrolled, setIsScrolled] = useState(null);
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const [filter, setFilter] = useState("");
  const [inputError, setInputError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshCycle, setRefreshCycle] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const previousModalVisibleRef = useRef(modal.isVisible);

  function logHistoryDebug(step, details = {}) {
    console.info(`[credentials][history] ${step}`, details);
  }

  function getEntryIdentifier(entry) {
    if (!entry) {
      return null;
    }

    return entry.clientId
      ? `client:${entry.clientId}`
      : entry.id || entry.token || null;
  }

  function isTransientEntry(entry) {
    return Boolean(
      entry?.isPending ||
        entry?.status === "ERROR" ||
        entry?.status === "INVALID"
    );
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

      return [entry, ...filtered].slice(0, MAX_CLIENT_ENTRIES);
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
      removeHistoryItem(entry);
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
      const existingEntry = history?.find?.(
        (item) => item?.clientId === normalizedClientId
      );

      if (existingEntry) {
        // Re-resolve existing clients without an attached clientSecret so they
        // can pick up the current network setting instead of stale state.
        if (existingEntry.clientSecret || existingEntry.hasClientSecret) {
          const nextEntry = withCurrentNetworkSetting(existingEntry);

          setHistoryItem(nextEntry, false);
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
        ? history?.find?.((item) => item?.clientId === normalizedClientId) ||
          null
        : history?.find?.((item) => item?.token === filter.trim()) || null;

    if (!existingEntry && (history?.length || 0) >= MAX_CLIENT_ENTRIES) {
      setInputError(`Max ${MAX_CLIENT_ENTRIES} applications.`);
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

    logHistoryDebug("submit resolved", {
      submittedType: inputType,
      requestedEntryId: existingEntry?.id || null,
      requestedClientId: existingEntry?.clientId || normalizedClientId || null,
      responseStatus: response?.status || null,
      safeEntryId: response?.safeEntry?.id || null,
      safeEntryType: response?.safeEntry?.type || null,
      safeEntryClientId: response?.safeEntry?.clientId || null,
      safeEntryTokenPreview:
        typeof response?.safeEntry?.token === "string"
          ? `${response.safeEntry.token.slice(0, 6)}...`
          : null,
      requiresClientSecret: response?.safeEntry?.requiresClientSecret ?? null,
    });

    if (response?.safeEntry) {
      await ensurePendingDuration(pendingStartedAt);

      if (pendingEntry) {
        removeStateEntry(pendingEntry);
      }

      const nextEntry = withCurrentNetworkSetting(response.safeEntry);

      logHistoryDebug("persisting resolved entry", {
        submittedType: inputType,
        nextEntryId: nextEntry.id || null,
        nextEntryType: nextEntry.type || null,
        nextEntryClientId: nextEntry.clientId || null,
        nextEntryTokenPreview:
          typeof nextEntry.token === "string"
            ? `${nextEntry.token.slice(0, 6)}...`
            : null,
        networkSetting: nextEntry.networkSetting || null,
      });

      setHistoryItem(nextEntry, false);
      syncStateWithEntry(nextEntry);

      if (nextEntry.token) {
        setSelectedToken(nextEntry.token, nextEntry.profile, nextEntry.agency, {
          id: nextEntry.id,
          type: nextEntry.type,
          clientId: nextEntry.clientId,
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
      setRefreshCycle((current) => current + 1);
    }

    if (
      !modal.isVisible &&
      previousModalVisibleRef.current &&
      selectedToken?.token
    ) {
      setHistoryItem(selectedToken, false);
    }

    previousModalVisibleRef.current = modal.isVisible;
  }, [modal.isVisible, selectedToken, setHistoryItem]);

  useEffect(() => {
    setState((current) => {
      const transientEntries = current.filter((entry) => {
        if (!isTransientEntry(entry)) {
          return false;
        }

        const identifier = getEntryIdentifier(entry);

        return !history.some(
          (historyEntry) => getEntryIdentifier(historyEntry) === identifier
        );
      });

      return [...transientEntries, ...history].slice(0, MAX_CLIENT_ENTRIES);
    });
  }, [history]);

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
  const expandedClass = isAddExpanded ? styles.expanded : "";

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
          onClick={() => setIsAddExpanded(false)}
          className={styles.closeIcon}
          aria-label="Close add application"
          tabIndex={isAddExpanded ? 0 : -1}
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
        {!state?.length && <span>You have no applications yet 🥹</span>}
        {state?.map((h, i) => {
          return (
            <HistoryItem
              key={h.id || `${h.token}-${i}`}
              isVisible={modal.isVisible}
              refreshCycle={refreshCycle}
              inUse={isEqual(selectedToken, h)}
              onRemoveRequest={handleRemoveEntry}
              {...h}
            />
          );
        })}
      </Col>
    </Row>
  );
}

export default History;
