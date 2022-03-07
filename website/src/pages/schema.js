import Head from "next/head";
import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import { Col, Row } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useSchema from "@/hooks/useSchema";
import Schema from "@/components/base/graphql/schema/Schema";

export default function Page() {
  const { selectedToken } = useStorage();
  const { schemaStr } = useSchema(selectedToken);

  return (
    <>
      <Head>
        <title>Schema</title>
      </Head>
      <Header />
      <Layout>
        <Row>
          <Col>
            <Title tag="h1" type="title6">
              GraphQL Schema
            </Title>
            <Text>
              On this page you get an overview of the GraphQL schema available
              for the selected token. The schema defines a type system that
              describes which data can be retrieved. All calls to DBC Gateway
              are validated and executed against the schema. Learn about the
              GraphQL schema definition language{" "}
              <a href="https://graphql.org/learn/schema/" target="_blank">
                here
              </a>
              .
            </Text>
            <Schema>{schemaStr}</Schema>
          </Col>
        </Row>
      </Layout>
    </>
  );
}
