import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

import { useRouter } from "next/router";

import useToken from "@/hooks/useToken";

import Title from "@/components/base/title";
import Token from "@/components/token";
import Button from "@/components/base/button";
import Label from "@/components/base/label";

import styles from "./Hero.module.css";

export default function Hero({ className = "" }) {
  const router = useRouter();
  const { token, isValidating } = useToken();

  // Submit has been called => redirect if everything is ok
  // const [submit, setSubmit] = useState(false);
  // const [value, setValue] = useState("");

  // redirect
  // useEffect(() => {
  //   if (token && !isValidating && submit) {
  //     router.push({
  //       pathname: "/documentation",
  //     });
  //   }
  // }, [submit, token]);

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
            <Token
              id="token-input"
              // onChange={(value) => setValue(value)}
              // onSubmit={() => setSubmit(true)}
            />
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Button
              type="submit"
              disabled={!token}
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
