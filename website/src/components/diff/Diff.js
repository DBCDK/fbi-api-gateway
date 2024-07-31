import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import { Col, Row } from "react-bootstrap";

import Diff from "@/components/base/graphql/diff";

import Link from "@/components/base/link";

import styles from "./Diff.module.css";

export default function Wrap() {
  return (
    <>
      <Header />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Title as="h1" type="title6" className={styles.title}>
              GraphQL Schema [Diff]
            </Title>
            <Text>
              What has changed? Here you will find a detailed type diff between
              the current and future FBI-API Looking for the full future schema?
              Go{" "}
              <Link href="/schema" underline>
                here
              </Link>
              .
            </Text>
            <br />
            <Text type="text5" className>
              What is actually changed ...
            </Text>
            <Text>
              <ul>
                <li>Unused Scalar types was removed from the schema</li>
                <li>All previous deprecated fields are removed</li>
                <li>All Types in now written in PascalCase</li>
                <li>All Enum value fields is now written in UPPERCASE</li>
                <li>All field names is now unique regardless caseing</li>
                <li>All Input Types now have a tailed 'Input'</li>
                <li>All Scalar Types now have a tailed 'Scalar'</li>
                <li>All Union Types now have a tailed 'Union'</li>
                <li>All Interface Types now have a tailed 'Interface'</li>
              </ul>
            </Text>
            <Diff />
          </Col>
        </Row>
      </Layout>
    </>
  );
}
