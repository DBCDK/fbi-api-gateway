/**
 * @file Shows a history of the used tokens
 */

import { useState, useEffect } from "react";
import { Col, Offcanvas, Row } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";

import Text from "@/components/base/text";
import Button from "@/components/base/button";
import Input from "@/components/base/input";

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
  const [isAddExpanded, setIsAddExpanded] = useState(false);
  const [filter, setFilter] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    alert("Vrinsk!");
  }

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
            >
              <span className={styles.addButtonContent}>
                <span className={styles.plusIcon} aria-hidden="true" />
                <Text type="text4">Add</Text>
              </span>
            </Button>
            <form className={styles.form} onSubmit={(e) => handleSubmit(e)}>
              <input
                className={styles.input}
                placeholder="Drop clientId og token to connect ..."
                onChange={(e) => setFilter(e.target.value)}
              />
              <button
                className={styles.submit}
                type="submit"
                disabled={!filter || filter === ""}
              >
                <span className={styles.submitGlyph} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </Col>
      <Col xs={12} className={styles.list}>
        {!state?.length && <span>You have no applications yet 🥹</span>}
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
      </Col>
    </Row>
  );
}

export default History;
