import { useState, useEffect } from "react";

import { Row, Col } from "react-bootstrap";

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
      <Col xs={12}>
        <Input className={styles.input} />
      </Col>
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
                <Link onClick={() => scrollTo(id)}>
                  <Text type="text5">{doc.name}</Text>
                </Link>
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

  useEffect(() => {
    setTimeout(() => {
      const offset = 100;
      let options = {
        root: null,
        rootMargin: "0px",
        threshold: 1,
      };

      let callback = (entries, observer) => {
        entries.forEach((entry) => {
          // console.log("entry", entry.isIntersecting, entry.target);
          // Each entry describes an intersection change for one observed
          // target element:
          //   entry.boundingClientRect
          //   entry.intersectionRatio
          //   entry.intersectionRect
          //   entry.isIntersecting
          //   entry.rootBounds
          //   entry.target
          //   entry.time

          if (window.scrollY > entry.boundingClientRect.top - offset) {
            const id = entry.target.getAttribute("id");
            setActive(id);
          }
        });
      };

      let observer = new IntersectionObserver(callback, options);
      // const targets = Object.entries()
      const matches = document.querySelectorAll("section[id]");
      matches.forEach((match) => observer.observe(match));
    }, 200);
  }, []);

  return <Menu active={active} {...props} />;
}
