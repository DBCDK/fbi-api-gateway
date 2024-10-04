import { useState } from "react";

import { Container, Row, Col } from "react-bootstrap";
import { MDXRemote } from "next-mdx-remote";

import useConfiguration from "@/hooks/useConfiguration";
import useDocuments from "@/hooks/useDocuments";
import useStorage from "@/hooks/useStorage";

import { InlineGraphiQL } from "@/components/graphiql";
import { DescribeEnum } from "@/components/schema/describe";
import {
  DeprecationBox,
  DeprecationBorder,
  DeprecationTitle,
  Changelog,
} from "@/components/deprecation";

import Progress from "@/components/base/progress";
import Complexity from "@/components/complexity";
import Depth from "@/components/depth";
import Header from "@/components/header";
import Menu from "@/components/menu";

import styles from "./Docs.module.css";

const customComponents = {
  InlineGraphiQL,
  DeprecationBox,
  DeprecationBorder,
  DeprecationTitle,
  Changelog,
  Progress,
  Complexity,
  Depth,
  DescribeEnum,
};

export default function Docs() {
  const { docs } = useDocuments();
  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  // const containerRef = useRef(null);
  const [containerRef, setContainerRef] = useState();

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

  return (
    <>
      <Header />
      <Container fluid>
        <Row className={styles.wrap}>
          <Col className={styles.menu}>
            <Menu docs={accessibleDocs} containerRef={containerRef} />
          </Col>
          <Col
            className={styles.content}
            ref={(el) => el && setContainerRef(el)}
            id="container"
          >
            {accessibleDocs?.map((doc, idx) => {
              const id = `${doc.name}-${idx}`;

              return (
                <section key={doc.name} id={id}>
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
