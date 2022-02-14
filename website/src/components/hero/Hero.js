import { useState } from "react";
import nookies from "nookies";
import { Container, Row, Col } from "react-bootstrap";
import { router } from "next/router";

import Title from "@/components/base/title";
import Link from "@/components/base/link";
import Button from "@/components/base/button";
import Text from "@/components/base/text";
import Input from "@/components/base/input";
import Label from "@/components/base/label";

import styles from "./Hero.module.css";

export default function Hero({ className = "" }) {
  // const router = useRouter();
  const [token, setToken] = useState(null);

  return (
    <section className={`${styles.hero} ${className}`}>
      <Container>
        <Row className={styles.row}>
          <Col>
            <Label for="token-input">
              <Title className={styles.title}>
                Drop your token here to get started
              </Title>
            </Label>
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Input
              id="token-input"
              onBlur={(e) => setToken(e.target.value)}
              placeholder="Drop token here ..."
            />
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Link href="/graphiql">
              <Button
                onClick={() => {
                  nookies.set({}, "token", token, {
                    maxAge: 30 * 24 * 60 * 60,
                    path: "/",
                  });
                }}
              >
                Go!
              </Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
