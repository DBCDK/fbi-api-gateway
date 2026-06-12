import { useMemo, useState } from "react";

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
import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Button from "@/components/base/button/Button";
import Highlight from "@/components/base/highlight";

import styles from "./Docs.module.css";

// Custom components to be used in MDX (passed directly — MDXProvider v2 is incompatible with next-mdx-remote v6)
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
  Link,
  Button,
  Highlight,
  h1: ({ children }) => (
    <Title type="title6" as="h1">
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Title type="title4" as="h2">
      {children}
    </Title>
  ),
  h3: ({ children }) => (
    <Title type="title7" as="h3">
      {children}
    </Title>
  ),
  code: ({ children }) => (
    <code style={{ whiteSpaceCollapse: "preserve" }}>{children}</code>
  ),
  p: ({ children }) => <Text type="text2">{children}</Text>,
  li: ({ children }) => (
    <li>
      <Text type="text1">{children}</Text>
    </li>
  ),
  a: ({ children, href }) => (
    <Link
      href={href}
      underline
      target={href?.startsWith("http") ? "_blank" : "_self"}
    >
      {children}
    </Link>
  ),
};

export default function Docs() {
  const { docs } = useDocuments();
  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const [containerRef, setContainerRef] = useState();

  // Only include docs usable by the selected token
  const accessibleDocs = useMemo(
    () =>
      docs?.filter((doc) => {
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
      }) || [],
    [docs, configuration?.permissions]
  );

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
