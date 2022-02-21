import { Container, Row, Col } from "react-bootstrap";
import Layout from "@/components/base/layout";

import Top from "@/components/topbar";
import Hero from "@/components/hero";

import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";

import styles from "./Home.module.css";

export default function Home() {
  return (
    <>
      <Top />
      <Hero />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Text className={styles.text}>Hello! You have found the</Text>
            <Title tag="h1" type="title6" className={styles.title}>
              DBC Gateway documentation page
            </Title>
          </Col>
        </Row>

        <Row className={styles.content}>
          <Col>
            <Title tag="h2" type="title1" className={styles.title}>
              What is this?
            </Title>
            <Text className={styles.text}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
              pretium turpis ac ligula ullamcorper, ut consequat lorem finibus.
              Curabitur porta magna sed massa mattis scelerisque. In rhoncus
              fringilla nisi, at dignissim ex pharetra et. Sed ullamcorper quis
              urna eget tempus. Integer a nisl dui. Vivamus aliquet ultrices
              tempor. Nullam mattis sapien ut metus tempus, id porta erat
              vestibulum. Maecenas nec orci leo.
            </Text>
          </Col>
        </Row>

        <Row className={styles.content}>
          <Col>
            <Title tag="h2" type="title1" className={styles.title}>
              Why this?
            </Title>
            <Text className={styles.text}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
              pretium turpis ac ligula ullamcorper, ut consequat lorem finibus.
              Curabitur porta magna sed massa mattis scelerisque. In rhoncus
              fringilla nisi, at dignissim ex pharetra et. Sed ullamcorper quis
              urna eget tempus.
            </Text>
          </Col>
        </Row>

        <Row className={styles.content}>
          <Col>
            <Title tag="h2" type="title1" className={styles.title}>
              Dont have a token?
            </Title>
            <Text className={styles.text}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc
              pretium turpis ac ligula ullamcorper, ut consequat lorem finibus.
              Curabitur porta magna sed massa mattis scelerisque.
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
