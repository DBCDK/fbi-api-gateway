import { MDXProvider } from "@mdx-js/react";
import { MDXRemote } from "next-mdx-remote";
import Head from "next/head";
import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import { Col, Row } from "react-bootstrap";
import useConfiguration from "@/hooks/useConfiguration";

import useDocuments from "@/hooks/useDocuments";
import useStorage from "@/hooks/useStorage";
import { InlineGraphiQL } from "@/components/graphiql/GraphiQL";

const components = {
  h1: ({ children }) => (
    <Title type="title3" tag="h1" style={{ marginTop: 40 }}>
      {children}
    </Title>
  ),
  h2: ({ children }) => (
    <Title type="title1" tag="h2" style={{ marginTop: 16 }}>
      {children}
    </Title>
  ),
  p: ({ children }) => (
    <Text type="text1" style={{ marginTop: 8 }}>
      {children}
    </Text>
  ),
};

const customComponents = { InlineGraphiQL };

function DocsMenu({ docs }) {
  return (
    docs?.map((doc) => (
      <div
        key={doc.name}
        onClick={() => {
          document.getElementById(doc.name)?.scrollIntoView?.();
        }}
      >
        {doc.name}
      </div>
    )) || null
  );
}

export default function Page() {
  const { docs } = useDocuments();
  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  // Only include docs usable by the selected token
  const accessibleDocs = docs?.filter((doc) => {
    if (configuration?.permissions?.admin) {
      return true;
    }
    if (configuration?.permissions?.allowRootFields?.includes(doc.name)) {
      return true;
    }
    return false;
  });

  return (
    <>
      <Head>
        <title>Documentation</title>
      </Head>
      <Header />
      <Layout>
        <Row>
          <Col>
            <DocsMenu docs={accessibleDocs} />
            <MDXProvider components={components}>
              {accessibleDocs?.map((doc, idx) => (
                <div key={doc.name} id={doc.name}>
                  <MDXRemote {...doc.mdxSource} components={customComponents} />
                </div>
              ))}
            </MDXProvider>
          </Col>
        </Row>
      </Layout>
    </>
  );
}
