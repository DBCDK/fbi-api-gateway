import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import { Col, Row } from "react-bootstrap";

import Diff from "@/components/base/graphql/diff";

import Link from "@/components/base/link";

import styles from "./Changes.module.css";

export default function Wrap() {
  return (
    <>
      <Header />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Title as="h1" type="title6" className={styles.title}>
              GraphQL Schema <strong>[changes]</strong>
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
              So what is actually changed ...
            </Text>

            <ul className={styles.list}>
              <li>
                <Text>Unused Scalar types was removed from the schema</Text>
              </li>
              <li>
                <Text>
                  All current and previous deprecated fields was removed
                </Text>
              </li>
              <li>
                <Text>All Types in now written in PascalCase</Text>
              </li>
              <li>
                <Text>All Enum value fields is now written in UPPERCASE</Text>
              </li>
              <li>
                <Text>All field names is now unique regardless caseing</Text>
              </li>
              <li>
                <Text>All Input Types now have a tailed 'Input'</Text>
              </li>
              <li>
                <Text>All Scalar Types now have a tailed 'Scalar'</Text>
              </li>
              <li>
                <Text>All Union Types now have a tailed 'Union'</Text>
              </li>
              <li>
                <Text>All Interface Types now have a tailed 'Interface'</Text>
              </li>
            </ul>

            <Diff />
          </Col>
        </Row>
      </Layout>
    </>
  );
}
