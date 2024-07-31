import { Container, Row, Col } from "react-bootstrap";
import Layout from "@/components/base/layout";

import Header from "@/components/header";
import Hero from "@/components/hero";

import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";

import useTheme from "@/hooks/useTheme";

import styles from "./Home.module.css";

export default function Home() {
  const { theme } = useTheme();

  const isFuture = theme === "future";

  return (
    <>
      <Header />
      <Hero />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Text className={styles.text}>Hello! You have found the</Text>
            <Title as="h1" type="title6" className={styles.title}>
              <strong>[FUTURE]</strong> FBI API
            </Title>
          </Col>
        </Row>

        {isFuture && (
          <Row className={styles.content}>
            <Col>
              <Title as="h2" type="title1" className={styles.title}>
                What does this <strong>{"'Future'"}</strong> thing mean?
              </Title>
              <Text className={styles.text}>
                This future version of the FBI-API is designed for significant
                schema migrations. It does not represent the current API schema
                but rather depicts what it will look like in the near future.
              </Text>
              <Text className={styles.text}>
                Just looking for the standard FBI-API? Click{" "}
                <Link href="https://fbi-api.dbc.dk/" underline>
                  here
                </Link>{" "}
                {"and we'll take you 'back to the present'"} 🫠.
              </Text>
            </Col>
          </Row>
        )}
        <Row className={styles.content}>
          <Col>
            <Title as="h2" type="title1" className={styles.title}>
              What is this?
            </Title>
            <Text className={styles.text}>
              FBI API offers a uniform and flexible API to access a wide variety
              of services within the danish library area. The API is a part of
              the Common Library Infrastructure, in danish “Fælles
              Biblioteksinfrastrutur”. The API allows access to metadata about
              libraries and their collections and services like search, order
              and recommendations.
            </Text>
            <Text as="span">
              The API is based on GraphQL, which provides benefits such as:
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
            <Title as="h2" type="title1" className={styles.title}>
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
              <Link
                href="mailto:kundeservice@dbc.dk"
                target="_blank"
                keepActive
              >
                kundeservice@dbc.dk
              </Link>
            </Text>
          </Col>
        </Row>
      </Layout>
    </>
  );
}
