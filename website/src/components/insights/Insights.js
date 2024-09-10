import { useState } from "react";
import { Col, Row } from "react-bootstrap";

import useSchema from "@/hooks/useSchema";
import useStorage from "@/hooks/useStorage";
import useInsights from "@/hooks/useInsights";

import { buildTemplates, getFields } from "./utils";

import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Chip from "../base/chip";

import Search from "./search";
import Result from "./result";

import styles from "./Insights.module.css";
import { orderBy } from "lodash";
import Period from "./period";

export default function Insights() {
  const { selectedToken } = useStorage();
  const { json } = useSchema(selectedToken);

  const [settings, setSettings] = useState({
    filter: null,
    isDeprecated: false,
    hasComplexity: false,
    sort: null,
    sortDirection: "asc",
  });

  let data = buildTemplates(getFields(json));

  function updateOptions(key, value) {
    setSettings({ ...settings, [key]: value });
  }

  if (settings.filter) {
    data = data?.filter(
      ({ field, type }) =>
        field?.toLowerCase().includes(settings?.filter?.toLowerCase()) ||
        type?.toLowerCase().includes(settings?.filter?.toLowerCase()) ||
        `${type}.${field}`?.toLowerCase().includes(settings?.filter?.toLowerCase())
    );
  }

  if (settings.isDeprecated) {
    data = data?.filter((d) => d.isDeprecated);
  }

  if (settings.sort) {
    data = orderBy(data, [settings.sort], [settings.sortDirection]);
  }

  return (
    <>
      <Header />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Title as="h1" type="title6" className={styles.title}>
              FBI-API <strong>[Insights]</strong>
            </Title>
            <Text>{"Some blah...."}</Text>
          </Col>
        </Row>
        <Row className={styles.wrap}>
          <Col>
            <div className={styles.settings}>
              <Period className={styles.period} />
            </div>
            <div className={styles.filters}>
              <div className={styles.options}>
                <Chip
                  checked={settings.isDeprecated}
                  onChange={(state) => updateOptions("isDeprecated", state)}
                >
                  {settings.isDeprecated ? "✔ Deprecated" : "✕ Deprecated"}
                </Chip>
                <Chip
                  checked={settings.hasComplexity}
                  onChange={(state) => updateOptions("hasComplexity", state)}
                >
                  {settings.hasComplexity ? "✔ Complexity" : "✕ Complexity"}
                </Chip>
              </div>

              <Search onChange={(val) => updateOptions("filter", val)} />
            </div>

            <Result data={data} />
          </Col>
        </Row>
      </Layout>
    </>
  );
}
