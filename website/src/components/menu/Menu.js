import { useState, useEffect, useMemo } from "react";
import { throttle } from "lodash";

import { Row, Col } from "react-bootstrap";
import Collapse from "react-bootstrap/Collapse";

import Link from "@/components/base/link";
import Text from "@/components/base/text";

import styles from "./Menu.module.css";
import { useRouter } from "next/router";

/* --------------------------------------------
 * Offset til sticky header (justér efter behov)
 * ------------------------------------------*/
const OFFSET = 140;

/* --------------------------------------------
 * Smooth scroll (bruges til både menu- og docs-links)
 * ------------------------------------------*/
function smoothScrollTo({ top, offset = 0, callback }) {
  const target = Math.max(0, Math.round(top - offset));
  const onScroll = () => {
    if (Math.round(window.pageYOffset) === target) {
      window.removeEventListener("scroll", onScroll);
      callback?.();
    }
  };
  window.addEventListener("scroll", onScroll);
  // Kick off (nogle browsere skal have lytteren først)
  onScroll();
  window.scrollTo({ top: target, behavior: "smooth" });
}

/* Live top baseret på DOM-id (mere robust end gemt offsetTop) */
function liveTopById(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return Math.round(rect.top + window.scrollY);
}

/* Slug helper (bevarer emojis) */
function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/* Tolerant match – men nu forventer vi primært exact menu-format:
   - id
   - id-slug
   - (fallback) tag-slug og tag-slug-*
*/
function matchesHash(s, anchor) {
  const id = s.id || s.headingId;
  const tag = s.tag || "h2";
  const slug = slugify(s.text || "");
  return (
    anchor === id ||
    anchor === `${id}-${slug}` ||
    anchor === `${tag}-${slug}` ||
    anchor.startsWith(`${tag}-${slug}-`)
  );
}

/* Opdater hash UDEN at trigge hashchange / Next routing */
function setHash(desired) {
  if (typeof window === "undefined") return;
  if (location.hash.slice(1) !== desired) {
    history.replaceState(null, "", `#${desired}`);
  }
}

/* --------------------------------------------
 * Menu-komponenten
 * ------------------------------------------*/
export function Menu({ sections, active, onClick, isScrolling }) {
  const [activeParent, setActiveParent] = useState();

  useEffect(() => {
    const hit = sections?.find?.(
      (section) =>
        active === section?.id ||
        section?.subHeadings?.find?.((subHeading) => subHeading.id === active)
    );
    if (activeParent !== hit?.id && !isScrolling) {
      setActiveParent(hit?.id);
    }
  }, [active, sections, isScrolling]);

  return (
    <Row as="ul" className={styles.menu} id="menu">
      <Col xs={12}>
        <Row as="ul" className={styles.items}>
          {sections?.map((s) => {
            const hasSubheadings = (s.subHeadings?.length || 0) > 0;
            const isActive = s.id === active;

            const expandSubheadings =
              hasSubheadings &&
              (!isScrolling || activeParent === s.id) &&
              (s.subHeadings.find((x) => x.id === active) || isActive);

            const activeClass = isActive ? styles.active : "";
            const tagClass = styles[s.tag] || "";
            const highlightClass = s.highlight ? styles.highlight : "";

            return (
              <Col
                as="li"
                key={s.id}
                className={`${styles.item} ${tagClass} ${activeClass} ${highlightClass}`}
              >
                <Text type={s.tag === "h1" ? "text5" : "text2"}>
                  <Link
                    onClick={(e) => {
                      e.preventDefault?.();
                      onClick(s); // smooth scroll håndteres i Wrap
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.keyCode === 13) {
                        e.preventDefault?.();
                        onClick(s);
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
                        {s.subHeadings.map((sub) => {
                          const isSubActive = sub.id === active;
                          const subActiveClass = isSubActive
                            ? styles.active
                            : "";
                          const subTagClass = styles[sub.tag] || "";
                          const subHighlightClass = sub.highlight
                            ? styles.highlight
                            : "";

                          return (
                            <Col
                              as="li"
                              key={sub.id}
                              className={`${styles.item} ${subTagClass} ${subActiveClass} ${subHighlightClass}`}
                            >
                              <Text type={sub.tag === "h1" ? "text5" : "text2"}>
                                <Link
                                  onClick={(e) => {
                                    e.preventDefault?.();
                                    onClick(sub); // smooth i Wrap
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.keyCode === 13) {
                                      e.preventDefault?.();
                                      onClick(sub);
                                    }
                                  }}
                                >
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: sub.html,
                                    }}
                                  />
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

/* --------------------------------------------
 * Udlæsning af h1+h2 fra content
 * ------------------------------------------*/
function getHeadings(container) {
  // H1 som sektioner, H2 under samme parent
  const headings = container.querySelectorAll("h1");

  const slug = (txt) =>
    (txt || "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");

  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
  };

  function extract(el) {
    const top = el.offsetTop; // beholdt til scrollspy-sammenligning
    const tag = el.tagName.toLowerCase();
    const text = el.innerText || "";
    const html = el.innerHTML || "";
    const stableId = `${tag}-${slug(text)}-${hash(text)}`;
    el.id = stableId; // så liveTopById kan finde elementet
    return {
      tag,
      html,
      text,
      top,
      id: stableId,
      highlight: !!el.querySelector(
        '[data-highlighted="true"], .highlightedHeading'
      ),
    };
  }

  const arr = [];
  headings.forEach((h1) => {
    const parent = h1.parentNode;
    const sectionId = parent.getAttribute("id");
    const { tag, html, text, top, id: headingId, highlight } = extract(h1);

    const subHeadings = parent.querySelectorAll("h2");
    const subs = [];
    subHeadings.forEach((h2) => {
      const sub = extract(h2);
      subs.push({ ...sub, headingId, sectionId });
    });

    arr.push({
      tag,
      html,
      text,
      top,
      id: headingId,
      sectionId,
      subHeadings: subs,
      highlight,
    });
  });

  return arr;
}

/* --------------------------------------------
 * Wrap – styrer scroll, hash og scrollspy
 * ------------------------------------------*/
export default function Wrap(props) {
  const [active, setActive] = useState();
  const [isScrolling, setIsScrolling] = useState(false);
  const router = useRouter();

  const container = props.containerRef;
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (!container) return;

    const handleMutation = throttle(() => {
      const data = getHeadings(container);
      setSections(data);
    }, 10);

    const observer = new ResizeObserver(handleMutation);
    observer.observe(container);
    handleMutation();
    return () => observer.disconnect();
  }, [container]);

  const flattenSections = useMemo(() => {
    const subs = sections.map((s) => s.subHeadings || []).flat();
    return [...subs, ...sections].sort((a, b) => (a.top > b.top ? 1 : -1));
  }, [sections]);

  // Scrollspy (som din originale)
  useEffect(() => {
    const onScroll = throttle(() => handleScroll(), 10);

    function handleScroll() {
      const scrollY = window.scrollY;
      const offset = 0;

      const hit =
        flattenSections.length > 0 &&
        flattenSections.reduce((prev, cur) =>
          Math.abs(scrollY + offset - cur.top) <
          Math.abs(scrollY + offset - prev.top)
            ? cur
            : prev
        );

      if (hit) setActive(hit.id);
    }

    handleScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [flattenSections]);

  // Hjælper til at finde match fra nuværende hash
  const findMatchFromHash = () => {
    const anchor = decodeURIComponent(location?.hash?.replace("#", "") || "");
    if (!anchor) return null;
    return flattenSections?.find?.((s) => matchesHash(s, anchor));
  };

  // Hard refresh + hashchange → SMOOTH scroll med OFFSET
  useEffect(() => {
    const run = () => {
      const match = findMatchFromHash();
      if (!match) return;

      const id = match.id || match.headingId;
      const live = liveTopById(id);
      const top = live ?? match.top;

      setIsScrolling(true);
      smoothScrollTo({
        top,
        offset: OFFSET,
        callback: () => setIsScrolling(false),
      });
    };

    // initial
    run();

    // når hash ændrer sig (fx back/forward)
    const onHash = () => run();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [router, flattenSections]);

  // Intercept dokumentationslinks (a[href^="#"]) → SMOOTH, ingen native bump
  useEffect(() => {
    if (!container) return;

    const onClickCapture = (evt) => {
      let node = evt.target;
      let anchorEl = null;
      while (node && node !== container) {
        if (node.nodeType === 1 && node.matches?.('a[href^="#"]')) {
          anchorEl = node;
          break;
        }
        node = node.parentNode;
      }
      if (!anchorEl) return;

      const raw = anchorEl.getAttribute("href") || "";
      const anchor = decodeURIComponent(raw.replace("#", ""));

      // nu er anchor i samme format som menuen (#<id>-<slug>)
      const match = flattenSections?.find?.((s) => matchesHash(s, anchor));
      if (!match) return;

      // stop native jump (bump), vi scroller selv
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();

      const id = match.id || match.headingId;
      const live = liveTopById(id);
      const top = live ?? match.top;

      // opdater hash til *præcis* det link, der blev klikket (uden hashchange)
      setHash(anchor);

      setIsScrolling(true);
      smoothScrollTo({
        top,
        offset: OFFSET,
        callback: () => setIsScrolling(false),
      });
    };

    container.addEventListener("click", onClickCapture, { capture: true });
    return () =>
      container.removeEventListener("click", onClickCapture, { capture: true });
  }, [container, flattenSections]);

  // Klik i menu → SMOOTH (samme offset & hash-format)
  const handleMenuClick = (s) => {
    const id = s.id || s.headingId;
    const slug = slugify(s.text || "");
    const desired = `${id}-${slug}`;

    setHash(desired);

    const live = liveTopById(id);
    const top = live ?? s.top;

    setIsScrolling(true);
    smoothScrollTo({
      top,
      offset: OFFSET,
      callback: () => setIsScrolling(false),
    });
  };

  return (
    <Menu
      sections={sections}
      active={active}
      {...props}
      isScrolling={isScrolling}
      onClick={handleMenuClick}
    />
  );
}
