import { Container, Row, Col } from "react-bootstrap";
import Layout from "@/components/base/layout";

import Header from "@/components/header";

import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";

import styles from "./Docs.module.css";

export default function Docs() {
  return (
    <>
      <Header />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Title tag="h1" type="title6">
              Hello!
            </Title>
            <Text>Docs goes here</Text>
          </Col>
        </Row>
      </Layout>
    </>
  );
}
