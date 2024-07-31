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
            <Text>What was actually changed ....</Text>
            <Diff />
          </Col>
        </Row>
      </Layout>
    </>
  );
}
