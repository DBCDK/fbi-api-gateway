import { Container, Row, Col } from "react-bootstrap";

import { useRouter } from "next/router";
import { useModal } from "@/components/modal";

import useStorage from "@/hooks/useStorage";

import Title from "@/components/base/title";
import Token from "@/components/token";
import Button from "@/components/base/button";
import Label from "@/components/base/label";

import styles from "./Hero.module.css";

export default function Hero({ className = "" }) {
  const modal = useModal();
  const router = useRouter();

  const { selectedToken } = useStorage();

  return (
    <section className={`${styles.hero} ${className}`}>
      <Container>
        <Row className={styles.row}>
          <Col>
            <Title className={styles.title}>
              <Label for="token-input">
                Drop your token here to get started
              </Label>
            </Title>
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Token id="token-input" />
            <Button
              className={styles.history}
              onClick={() => modal.push("history")}
              secondary
            >
              🔑
            </Button>
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Button
              type="submit"
              disabled={!selectedToken}
              form="token-input-form"
              onClick={() => {
                router.push({
                  pathname: "/documentation",
                });
              }}
              secondary
            >
              Go!
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
