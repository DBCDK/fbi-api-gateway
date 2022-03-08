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

  const [isReady, setIsReady] = useState(false);

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
            {isReady && <Menu docs={accessibleDocs} />}
          </Col>
          <Col className={styles.content}>
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
