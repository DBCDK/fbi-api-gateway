import { useState } from "react";

import Layout from "@/components/base/layout";
import Header from "@/components/header";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import { Col, Row } from "react-bootstrap";

import Diff from "@/components/base/graphql/diff";

import Link from "@/components/base/link";

import styles from "./Changes.module.css";
import Chip from "../base/chip";

export default function Wrap() {
  const [options, setOptions] = useState({
    profile: true,
    agency: true,
    client: true,
    enabled: true,
  });

  function updateOptions(key, value) {
    console.log("update", key, value);

    let _options = { ...options };

    if (key === "enabled") {
      Object.keys(options).forEach((k) => {
        console.log("????", k);
        _options[k] = value;
      });
    }

    console.log("_options", _options);

    setOptions({ ..._options, [key]: value });
  }

  console.log("options", { ...options });

  return (
    <>
      <Header />
      <Layout className={styles.container}>
        <Row>
          <Col>
            <Title as="h1" type="title6" className={styles.title}>
              GraphQL Schema <strong>[changes]</strong>
            </Title>
            <Text>
              {
                "Here, you will find a detailed type comparison between the current and future versions of the FBI-API. If you're looking for the complete future schema, you can find it "
              }
              <Link href="/schema" underline>
                here
              </Link>
              .
            </Text>
            <br />
            <Text>
              ⚠️ The visible changes are related to the clientId associated with
              the selected token.
            </Text>
            <br />
            <Text type="text5">{"So, what's actually changed?"}</Text>

            <ul className={styles.list}>
              <li>
                <Text>
                  Unused scalar types have been removed from the schema.
                </Text>
              </li>
              <li>
                <Text>
                  All current and previously deprecated fields have been
                  removed.
                </Text>
              </li>
              <li>
                <Text>All types are now written in PascalCase.</Text>
              </li>
              <li>
                <Text>All enum value fields are now written in UPPERCASE.</Text>
              </li>
              <li>
                <Text>
                  All field names are now unique regardless of casing.
                </Text>
              </li>
              <li>
                <Text>{"All input types now have the suffix 'Input'."}</Text>
              </li>
              <li>
                <Text>{"All scalar types now have the suffix 'Scalar'."}</Text>
              </li>
              <li>
                <Text>{"All union types now have the suffix 'Union'."}</Text>
              </li>
              <li>
                <Text>
                  {"All interface types now have the suffix 'Interface'"}.
                </Text>
              </li>
            </ul>
          </Col>
        </Row>
        <Row className={styles.wrap}>
          <Col>
            <Text type="text5">Changelog enhancement</Text>
            <Text>
              If the changelog enhancement is enabled, we will mark the
              fields/types that have not been found in the FBI-API request log
              for the last <strong>30 days</strong>. Please note that this is
              only a guideline and is <strong>NOT</strong> a guarantee that your
              application is not using the marked (<i>strikethrough</i>)
              fields/types.
            </Text>

            <div className={styles.options}>
              <Chip
                checked={options.enabled}
                onChange={(state) => updateOptions("enabled", state)}
              >
                {options.enabled ? "✔ Enabled" : "Enable"}
              </Chip>
            </div>

            <Text>
              By default we will search in the log by matching your{" "}
              <i>clientId</i>, <i>profile</i> and <i>agencyId</i> assoicated
              with the selected token.
            </Text>
            <br />
            <Text>
              If the 'Changelog enhancement' is enabled, the different search
              parameters can be toggled below.
            </Text>

            <div className={styles.options}>
              <Chip
                disabled={!options.enabled}
                checked={options.client}
                onChange={(state) => updateOptions("client", state)}
              >
                {options.client ? "✔" : "✕"} ClientId
              </Chip>
              <Chip
                disabled={!options.enabled}
                checked={options.profile}
                onChange={(state) => updateOptions("profile", state)}
              >
                {options.profile ? "✔" : "✕"} Profile
              </Chip>
              <Chip
                disabled={!options.enabled}
                checked={options.agency}
                onChange={(state) => updateOptions("agency", state)}
              >
                {options.agency ? "✔" : "✕"} AgencyId
              </Chip>
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <Diff />
          </Col>
        </Row>
      </Layout>
    </>
  );
}
