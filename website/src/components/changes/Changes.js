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
              Here, you will find a detailed type comparison between the current
              and future versions of the FBI-API. If you're looking for the
              complete future schema, you can find it{" "}
              <Link href="/schema" underline>
                here
              </Link>
              .
            </Text>
            <br />
            <Text type="text5" className>
              So, what's actually changed?
            </Text>

            <ul className={styles.list}>
              <li>
                <Text>
                  Unused scalar types have been removed from the schema.
                </Text>
              </li>
              <li>
                <Text>
                  All current and previously deprecated fields have been
                  removed.
                </Text>
              </li>
              <li>
                <Text>All types are now written in PascalCase.</Text>
              </li>
              <li>
                <Text>All enum value fields are now written in UPPERCASE.</Text>
              </li>
              <li>
                <Text>
                  All field names are now unique regardless of casing.
                </Text>
              </li>
              <li>
                <Text>All input types now have the suffix 'Input'.</Text>
              </li>
              <li>
                <Text>All scalar types now have the suffix 'Scalar'.</Text>
              </li>
              <li>
                <Text>All union types now have the suffix 'Union'.</Text>
              </li>
              <li>
                <Text>
                  All interface types now have the suffix 'Interface'.
                </Text>
              </li>
            </ul>

            <Diff />
          </Col>
        </Row>
      </Layout>
    </>
  );
}
