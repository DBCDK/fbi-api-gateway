import { Container, Row, Col } from "react-bootstrap";

import { useRouter } from "next/router";
import { useModal } from "@/components/modal";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import Title from "@/components/base/title";
import Token from "@/components/token";
import Button from "@/components/base/button";
import Label from "@/components/base/label";
import History from "@/components/history";

import styles from "./Hero.module.css";

export default function Hero({ className = "" }) {
  const modal = useModal();
  const router = useRouter();

  const { selectedToken } = useStorage();
  const { configuration } = useConfiguration(selectedToken);

  const inputIsValid =
    selectedToken && configuration && Object?.keys(configuration).length;

  // return (
  //   <section className={`${styles.hero} ${className}`}>
  //     <Container>
  //       <Row className={styles.row}>
  //         <Col>
  //           <Title className={styles.title}>
  //             <Label for="token-input">
  //               Drop your token here to get started
  //             </Label>
  //           </Title>
  //         </Col>
  //       </Row>

  //       <Row className={styles.row}>
  //         <Col>
  //           <Token id="token-input" />
  //           <History className={styles.history} />
  //         </Col>
  //       </Row>

  //       <Row className={styles.row}>
  //         <Col>
  //           <Button
  //             className={styles.go}
  //             type="submit"
  //             disabled={!inputIsValid}
  //             form="token-input-form"
  //             onClick={() => {
  //               router.push({
  //                 pathname: "/documentation",
  //               });
  //             }}
  //             secondary
  //           >
  //             Go!
  //           </Button>
  //         </Col>
  //       </Row>
  //     </Container>
  //   </section>
  // );

  return (
    <section className={`${styles.hero} ${className}`}>
      <Container>
        <Row className={styles.row}>
          <Col>
            <Title className={styles.title}>
              Configure access to get started
            </Title>
          </Col>
        </Row>

        <Row className={styles.row}>
          <Col>
            <Button
              className={styles.go}
              type="submit"
              // disabled={!inputIsValid}
              form="token-input-form"
              onClick={() => {
                modal.push("history");
                // router.push({
                //   pathname: "/documentation",
                // });
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
