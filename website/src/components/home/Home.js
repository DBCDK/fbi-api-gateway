import { Container, Row, Col } from "react-bootstrap";

import Top from "@/components/topbar";
import Hero from "@/components/hero";

import Title from "@/components/base/title";
import Text from "@/components/base/text";

import styles from "./Home.module.css";

export default function Home() {
  return (
    <>
      <Top />
      <Hero />
      <Container as="section" className={styles.container} fluid>
        <Row className={styles.welcome}>
          <Col>
            <Text className={styles.text}>Welcome to the</Text>
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
            <Text type="text3">DBC DIGITAL</Text>
            <Text type="text2" className={styles.email}>
              dbc@dbc.dk
            </Text>
          </Col>
        </Row>
      </Container>
    </>
  );
}
