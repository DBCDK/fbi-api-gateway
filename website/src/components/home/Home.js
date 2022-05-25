import { Container, Row, Col } from "react-bootstrap";
import Layout from "@/components/base/layout";

import Header from "@/components/header";
import Hero from "@/components/hero";

import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";

import styles from "./Home.module.css";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Text className={styles.text}>Hello! You have found the</Text>
            <Title tag="h1" type="title6" className={styles.title}>
              DBC Gateway
            </Title>
          </Col>
        </Row>

        <Row className={styles.content}>
          <Col>
            <Title tag="h2" type="title1" className={styles.title}>
              What is this?
            </Title>
            <Text className={styles.text}>
              DBC Gateway offers a uniform and flexible API to access a wide
              variety of services. The API is based on GraphQL, which provides
              benefits such as:
              <ul>
                <li>
                  A bult in query language - You decide what data you need, and
                  you get only that
                </li>
                <li>Access to many resources in a single request</li>
                <li>
                  A type system that expresses the full capapabilities of the
                  API, which allows for the creation of helpful developer tools
                </li>
              </ul>
            </Text>
          </Col>
        </Row>

        <Row className={styles.content}>
          <Col>
            <Title tag="h2" type="title1" className={styles.title}>
              Explore the API
            </Title>
            <Text className={styles.text}>
              On this site we have gathered developer tools and created
              documentation with a bunch of examples. Our goal is to make it as
              easy as possible to get an overview of the API capabilities, and
              to get you started making queries that fulfill your
              application&apos;s needs.
            </Text>
            <Text className={styles.text}>
              Head over to the{" "}
              <Link href="/documentation" underline>
                documentation page
              </Link>{" "}
              to get started.
            </Text>
          </Col>
        </Row>

        <Row className={styles.content}>
          <Col>
            <Text type="text5">DBC DIGITAL</Text>
            <Text type="text3" className={styles.email}>
              <Link onClick={(e) => e.preventDefault()} keepActive>
                dbc@dbc.dk
              </Link>
            </Text>
          </Col>
        </Row>
      </Layout>
    </>
  );
}
