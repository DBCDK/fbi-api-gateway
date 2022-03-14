import { useState, useEffect, useMemo } from "react";
import { throttle } from "lodash";

import { Row, Col } from "react-bootstrap";

import Link from "@/components/base/link";
// import Input from "@/components/base/input";
import Text from "@/components/base/text";

import styles from "./Menu.module.css";

function scrollTo(top, offset = 150) {
  window?.scrollTo({ top: top - offset, behavior: "smooth" });
}

export function Menu({ sections, active }) {
  return (
    <Row as="ul" className={styles.menu}>
      {/* <Col xs={12}>
        <Input className={styles.input} />
      </Col> */}
      <Col xs={12}>
        <Row as="ul" className={styles.items}>
          {sections?.map((s) => {
            const isActive = s.id === active;
            const activeClass = isActive ? styles.active : "";

            const tagStyle = styles[s.tag];

            return (
              <Col
                as="li"
                key={s.id}
                className={`${styles.item} ${tagStyle} ${activeClass}`}
              >
                <Text type="text2">
                  <Link onClick={() => scrollTo(s.top)}>{s.text}</Link>
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

  const container = props.containerRef.current;

  const sections = useMemo(() => {
    const matches = container.querySelectorAll("h1, h2");

    const arr = [];
    matches.forEach((match) => {
      const top = match.offsetTop;
      const height = match.offsetHeight;
      const parent = match.parentNode.getAttribute("id");
      const tag = match.tagName.toLowerCase();
      const text = match.textContent;
      const label = text?.toLowerCase().replace(/\s+/g, "-");
      const id = `${top}-${tag}-${label}`;

      arr.push({ tag, text, top, height, id, parent });
    });

    return arr;
  }, []);

  useEffect(() => {
    const onScroll = throttle(() => handleScroll(), 10);

    function handleScroll() {
      const scrollY = window.scrollY;
      const offset = 100;

      const hit = sections.reduce((prev, cur) =>
        Math.abs(scrollY + offset - cur.top) <
        Math.abs(scrollY + offset - prev.top)
          ? cur
          : prev
      );

      if (hit) {
        setActive(hit.id);
      }
    }

    // init scroll position
    handleScroll();

    window.addEventListener("scroll", onScroll);
    // cleanup on unMount
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return <Menu sections={sections} active={active} {...props} />;
}
