/**
 * @file Shows a history of the used tokens
 */

import { useState, useEffect } from "react";
import { Row } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";

import { isEqual } from "@/components/utils";
import HistoryItem from "./item";

import styles from "./History.module.css";

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
          <HistoryItem
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
