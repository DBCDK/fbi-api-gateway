import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import { Col, Row } from "react-bootstrap";

import useStorage from "@/hooks/useStorage";
import useDiff from "@/hooks/useDiff";
import Schema from "@/components/base/graphql/schema/Schema";
import Link from "@/components/base/link";

import styles from "./Diff.module.css";
import Diff from "../base/graphql/diff/Diff";
import { useGraphQLUrl } from "@/hooks/useSchema";

export default function Wrap() {
  const { selectedToken } = useStorage();

  const remoteSchemaUrl = useGraphQLUrl(`https://fbi-api.dbc.dk`);

  const obj = useDiff(selectedToken, { remoteSchemaUrl });

  console.log("hest", obj.diffNoColor);

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
              Here you will find a detailed diff between the current and future
              FBI-API Looking for the full future schema? Go{" "}
              <Link href="/schema" underline>
                here
              </Link>
              .
            </Text>
            <div>{obj?.diffNoColor}</div>
          </Col>
        </Row>
      </Layout>
    </>
  );
}
