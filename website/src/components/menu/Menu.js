import { useState, useEffect, useMemo } from "react";
import { throttle } from "lodash";

import { Row, Col } from "react-bootstrap";
import Collapse from "react-bootstrap/Collapse";

import Link from "@/components/base/link";
// import Input from "@/components/base/input";
import Text from "@/components/base/text";

import styles from "./Menu.module.css";

// function scrollTo({ top, offset = 150 }) {
//   window?.scrollTo({ top: top - offset, behavior: "smooth" });
// }

/**
 * Native scrollTo with callback
 * @param offset - offset to scroll to
 * @param callback - callback function
 */
function scrollTo({ top, offset = 150, callback }) {
  top = (top - offset).toFixed();
  const onScroll = function () {
    if (window.pageYOffset.toFixed() === top) {
      window.removeEventListener("scroll", onScroll);
      callback?.();
    }
  };

  window.addEventListener("scroll", onScroll);
  onScroll();
  window.scrollTo({ top, behavior: "smooth" });
}

export function Menu({ sections, active }) {
  const [isScrolling, setIsScrolling] = useState(false);

  return (
    <Row as="ul" className={styles.menu}>
      {/* <Col xs={12}>
        <Input className={styles.input} />
      </Col> */}
      <Col xs={12}>
        <Row as="ul" className={styles.items}>
          {sections?.map((s) => {
            const hasSubheadings = s.subHeadings.length > 0;
            const hasActiveSubheading =
              hasSubheadings && s.subHeadings.find((s) => s.id === active);

            const isActive =
              (isScrolling && hasActiveSubheading) || s.id === active;

            const expandSubheadings =
              hasSubheadings &&
              !isScrolling &&
              (isActive || hasActiveSubheading);

            const activeClass = isActive ? styles.active : "";
            const tagClass = styles[s.tag] || "";

            return (
              <Col
                as="li"
                key={s.id}
                className={`${styles.item} ${tagClass} ${activeClass}`}
              >
                <Text type={s.tag === "h1" ? "text5" : "text2"}>
                  <Link
                    onClick={() => {
                      setIsScrolling(!hasActiveSubheading);
                      scrollTo({
                        top: s.top,
                        callback: () => setIsScrolling(false),
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.keyCode === 13) {
                        setIsScrolling(!hasActiveSubheading);
                        scrollTo({
                          top: s.top,
                          callback: () => setIsScrolling(false),
                        });
                      }
                    }}
                  >
                    {s.text}
                  </Link>
                </Text>

                {hasSubheadings && (
                  <Collapse in={expandSubheadings}>
                    <div>
                      <Row
                        as="ul"
                        className={`${styles.items} ${styles.subitems}`}
                      >
                        {s.subHeadings.map((s) => {
                          const isActive = !isScrolling && s.id === active;
                          const activeClass = isActive ? styles.active : "";
                          const tagClass = styles[s.tag] || "";

                          return (
                            <Col
                              as="li"
                              key={s.id}
                              className={`${styles.item} ${tagClass} ${activeClass}`}
                            >
                              <Text type={s.tag === "h1" ? "text5" : "text2"}>
                                <Link
                                  onClick={() => scrollTo({ top: s.top })}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.keyCode === 13) {
                                      scrollTo({ top: s.top });
                                    }
                                  }}
                                >
                                  {s.text}
                                </Link>
                              </Text>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  </Collapse>
                )}
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
    const headings = container.querySelectorAll("h1");

    function extract(el) {
      const top = el.offsetTop;
      // const height = el.offsetHeight;
      const tag = el.tagName.toLowerCase();
      const text = el.textContent;
      const raw = text.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, "");
      const label = text?.toLowerCase().replace(/\s+/g, "-");
      const id = `${top}-${tag}-${label}`;
      return { tag, text, raw, top, id };
    }

    const arr = [];
    headings.forEach((h1) => {
      const parent = h1.parentNode;
      const sectionId = parent.getAttribute("id");
      const { tag, text, top, id: headingId } = extract(h1);
      const subHeadings = parent.querySelectorAll("h2");
      const subs = [];
      subHeadings.forEach((h2) =>
        subs.push({ ...extract(h2), headingId, sectionId })
      );
      arr.push({ tag, text, top, id: headingId, sectionId, subHeadings: subs });
    });

    return arr;
  }, []);

  const flattenSections = useMemo(() => {
    const subs = sections.map((s) => s.subHeadings).flat();
    return [...subs, ...sections].sort((a, b) => (a.top > b.top ? 1 : -1));
  }, [sections]);

  useEffect(() => {
    const onScroll = throttle(() => handleScroll(), 10);

    function handleScroll() {
      const scrollY = window.scrollY;
      const offset = 100;

      const hit = flattenSections.reduce((prev, cur) =>
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
