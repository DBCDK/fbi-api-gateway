import {
  useRef,
  useState,
  useMemo,
  createRef,
  useEffect,
  forwardRef,
} from "react";

import throttle from "lodash/throttle";

import { Container, Row, Col } from "react-bootstrap";
import { MDXProvider } from "@mdx-js/react";
import { MDXRemote } from "next-mdx-remote";

import useConfiguration from "@/hooks/useConfiguration";
import useDocuments from "@/hooks/useDocuments";
import useStorage from "@/hooks/useStorage";

import { InlineGraphiQL } from "@/components/graphiql/GraphiQL";

import Header from "@/components/header";
import Menu from "@/components/menu";

import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";

import styles from "./Docs.module.css";

const customComponents = { InlineGraphiQL };

export default function Docs() {
  const { docs } = useDocuments();
  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  useEffect(() => {
    const matches = document.querySelectorAll("section[id]");
    console.log("matches Docs", matches);
  }, [docs]);

  const refs = useRef({});

  // Only include docs usable by the selected token
  const accessibleDocs = docs?.filter((doc, idx) => {
    let state = false;

    if (configuration?.permissions?.admin) {
      state = true;
    }
    if (configuration?.permissions?.allowRootFields?.includes(doc.name)) {
      state = true;
    }
    return state;
  });

  return (
    <>
      <Header />
      <Container fluid>
        <Row className={styles.wrap}>
          <Col className={styles.menu}>
            <Menu docs={accessibleDocs} />
          </Col>
          <Col className={styles.content}>
            {accessibleDocs?.map((doc, idx) => {
              const id = `${doc.name}-${idx}`;

              // Create ref if not already exist
              refs.current[id] = refs.current[id] ?? createRef();

              return (
                <section key={doc.name} id={id} ref={refs.current[id]}>
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
