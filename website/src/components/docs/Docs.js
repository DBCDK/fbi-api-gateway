import { useRef, useState, useEffect } from "react";

import debounce from "lodash/debounce";

import { Container, Row, Col } from "react-bootstrap";
import { MDXRemote } from "next-mdx-remote";

import useConfiguration from "@/hooks/useConfiguration";
import useDocuments from "@/hooks/useDocuments";
import useStorage from "@/hooks/useStorage";

import { InlineGraphiQL } from "@/components/graphiql/GraphiQL";

import Header from "@/components/header";
import Menu from "@/components/menu";

import styles from "./Docs.module.css";

const customComponents = { InlineGraphiQL };

export default function Docs() {
  const { docs } = useDocuments();
  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const [isReady, setIsReady] = useState(false);

  const refs = useRef({});
  const containerRef = useRef(null);

  // Only include docs usable by the selected token
  const accessibleDocs = docs?.filter((doc) => {
    let state = false;

    // return all
    if (configuration?.permissions?.admin) {
      state = true;
    }
    // return all public docs
    if (doc.name.includes("public")) {
      state = true;
    }
    const splitName = doc.name.split(".");
    // return client allowed docs
    if (
      configuration?.permissions?.allowRootFields?.includes(
        splitName[splitName.length - 1]
      )
    ) {
      state = true;
    }
    return state;
  });

  useEffect(() => {
    // container changes hight after last render, so we observe height/width changes, and rerender the menu
    const resizeObserver = new ResizeObserver(
      debounce(() => setIsReady(false), 100)
    );
    resizeObserver.observe(containerRef.current);
  }, []);

  useEffect(() => {
    if (isReady) {
      refs.current = {};
      setIsReady(false);
    }
  }, [selectedToken]);

  function handleIsReady(el) {
    if (el) {
      const id = el.getAttribute("id");
      refs.current[id] = true;
      if (accessibleDocs.length === Object.keys(refs.current).length) {
        setIsReady(true);
      }
    }
  }

  return (
    <>
      <Header />
      <Container fluid>
        <Row className={styles.wrap}>
          <Col className={styles.menu}>
            {isReady && (
              <Menu docs={accessibleDocs} containerRef={containerRef} />
            )}
          </Col>
          <Col className={styles.content} ref={containerRef} id="container">
            {accessibleDocs?.map((doc, idx) => {
              const id = `${doc.name}-${idx}`;

              return (
                <section key={doc.name} id={id} ref={handleIsReady}>
                  <MDXRemote {...doc.mdxSource} components={customComponents} />
                </section>
              );
            })}
          </Col>
        </Row>
      </Container>
    </>
  );
}
