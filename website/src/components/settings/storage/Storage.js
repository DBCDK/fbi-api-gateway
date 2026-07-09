import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSWRConfig } from "swr";

import useApplications from "@/hooks/useApplications";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import { isWhatsNewRestorable, restoreWhatsNew } from "@/components/whats-new";
import styles from "./Storage.module.css";

const baseActions = [
  {
    label: "Reset preferences",
    value: "local",
    icon: "⚙️",
  },
  {
    label: "Clear current session",
    value: "session",
    icon: "📍",
  },
  {
    label: "Clear GraphiQL tabs ⚠️",
    value: "graphiql-tabs",
    icon: "🧪",
  },
  {
    label: "Clear applications ⚠️",
    value: "cookies",
    icon: "🔐",
  },
];

const DANGEROUS_ACTIONS = new Set(["graphiql-tabs", "cookies"]);

export function Storage({ className = "", ...props }) {
  const [show, setShow] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [canRestoreNews, setCanRestoreNews] = useState(false);
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { mutateApplications } = useApplications();
  const { clearSelectedCredential } = useSelectedCredential();

  const actions = useMemo(() => {
    const restoreNewsAction = canRestoreNews
      ? [
          {
            label: "Restore news",
            value: "restore-news",
            icon: "✨",
          },
        ]
      : [];

    return [
      ...baseActions.slice(0, 2),
      ...restoreNewsAction,
      ...baseActions.slice(2),
    ];
  }, [canRestoreNews]);

  useEffect(() => {
    setCanRestoreNews(isWhatsNewRestorable());
  }, []);

  function handleToggle(nextShow) {
    setShow(nextShow);

    if (nextShow) {
      setCanRestoreNews(isWhatsNewRestorable());
    }

    if (!nextShow) {
      setPendingConfirm(null);
    }
  }

  async function handleClick(e, value) {
    e.preventDefault();
    e.stopPropagation();

    if (DANGEROUS_ACTIONS.has(value) && pendingConfirm !== value) {
      setPendingConfirm(value);
      return;
    }

    setPendingConfirm(null);

    if (value === "local") {
      try {
        localStorage.removeItem("graphiql:theme");
        localStorage.removeItem("graphiql:execute");
        localStorage.removeItem("graphiql:disable-internal-network-check");
      } catch {}

      mutate("graphiql:theme", "system", false);
      mutate("graphiql:execute", "auto", false);
      mutate("graphiql:disable-internal-network-check", "enabled", false);
      setShow(false);
      return;
    }

    if (value === "session") {
      clearSelectedCredential();
      setShow(false);
      return;
    }

    if (value === "graphiql-tabs") {
      try {
        localStorage.removeItem("graphiql:tabState");
      } catch {}

      if (router.pathname === "/graphiql") {
        router.reload();
      }

      setShow(false);
      return;
    }

    if (value === "cookies") {
      try {
        await fetch("/api/credentials/session", {
          method: "DELETE",
        });
      } catch {}

      clearSelectedCredential();
      mutateApplications([], false);
      setShow(false);
      return;
    }

    if (value === "restore-news") {
      restoreWhatsNew();
      setCanRestoreNews(false);
      setShow(false);
    }
  }

  return (
    <Dropdown
      {...props}
      show={show}
      onToggle={handleToggle}
      className={`${styles.wrap} ${className}`}
      align="end"
      drop="up-centered"
      autoClose="outside"
    >
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip className={styles.tooltip} id="tooltip-storage">
            {"Cleanup"}
          </Tooltip>
        }
      >
        <Dropdown.Toggle className={styles.toggle} id="dropdown-storage-select">
          {"🧹"}
        </Dropdown.Toggle>
      </OverlayTrigger>

      <Dropdown.Menu className={styles.menu}>
        {actions.map(({ label, value, icon }) => (
          <OverlayTrigger
            key={value}
            placement="left"
            overlay={
              <Tooltip
                className={styles.tooltip}
                id={`tooltip-storage-${value}`}
              >
                {pendingConfirm === value ? "Confirm" : label}
              </Tooltip>
            }
          >
            <Dropdown.Item
              className={`${styles.item} ${
                pendingConfirm === value ? styles.itemConfirm : ""
              }`}
              onClick={(e) => handleClick(e, value)}
            >
              {pendingConfirm === value ? "✅" : icon}
            </Dropdown.Item>
          </OverlayTrigger>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default function Wrap(props) {
  return <Storage {...props} />;
}
