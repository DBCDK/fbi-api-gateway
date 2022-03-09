import { useState, useEffect, useMemo } from "react";
import { throttle } from "lodash";

import { Row, Col } from "react-bootstrap";

import useWindowSize from "@/hooks/useWindowSize";

import Link from "@/components/base/link";
import Input from "@/components/base/input";
import Text from "@/components/base/text";

import styles from "./Menu.module.css";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView?.({ behavior: "smooth" });
}

export function Menu({ docs, active }) {
  return (
    <Row as="ul" className={styles.menu}>
      {/* <Col xs={12}>
        <Input className={styles.input} />
      </Col> */}
      <Col xs={12}>
        <Row as="ul" className={styles.items}>
          {docs?.map((doc, idx) => {
            const id = `${doc.name}-${idx}`;

            const isActive = id === active;
            const activeClass = isActive ? styles.active : "";

            return (
              <Col
                as="li"
                key={doc.name}
                className={`${styles.item} ${activeClass}`}
              >
                <Text type="text5">
                  <Link onClick={() => scrollTo(id)}>{doc.name}</Link>
                </Text>
              </Col>
            );
          })}
        </Row>
      </Col>
    </Row>
  );
}

export default function Wrap(props) {
  const [active, setActive] = useState();
  const windowSize = useWindowSize();

  const container = props.containerRef.current;

  const sections = useMemo(() => {
    const matches = container.querySelectorAll("section[id]");

    const obj = {};
    matches.forEach((match) => {
      const top = match.offsetTop;
      const height = match.offsetHeight;
      const id = match.getAttribute("id");
      obj[id] = { top, height };
    });

    return obj;
  }, [windowSize.height, windowSize.width, container.offsetHeight]);

  useEffect(() => {
    const onScroll = throttle(() => handleScroll(), 10);

    function handleScroll() {
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const documentH = document.body.offsetHeight;
      const offset = 200;

      const first = Object.keys(sections)[0];
      const last = Object.keys(sections)[Object.keys(sections).length - 1];

      const hit = Object.keys(sections).find((k) => {
        return (
          scrollY + offset > sections[k].top &&
          scrollY + offset < sections[k].top + sections[k].height
        );
      });
      if (scrollY + offset < sections[first].top - offset) {
        setActive(first);
        return;
      }
      if (windowH + scrollY + offset >= documentH) {
        setActive(last);
        return;
      }
      if (hit) {
        setActive(hit);
        return;
      }
    }

    setTimeout(() => handleScroll(), 100);

    window.addEventListener("scroll", onScroll);
    // cleanup on unMount
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return <Menu active={active} {...props} />;
}
