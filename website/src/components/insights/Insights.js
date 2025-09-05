// views/insights/Insights.jsx
import { useMemo, useState, useRef, useLayoutEffect } from "react";
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
import Period from "./period";
import Canvas from "./canvas";

import styles from "./Insights.module.css";
import shellStyles from "./Shell.module.css";
import { orderBy } from "lodash";

export default function Insights() {
  const { selectedToken } = useStorage();
  const { json } = useSchema(selectedToken);

  const [days, setDays] = useState(14);
  const [settings, setSettings] = useState({
    filter: null,
    sort: null,
    sortDirection: "asc",
    deprecatedFilter: "off",
    countFilter: "off",
  });

  const { byFieldMap, byClient } = useInsights(selectedToken, { days });

  let data = useMemo(() => buildTemplates(getFields(json)), [json]);
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  if (settings.filter) {
    const q = settings.filter.toLowerCase();
    data = data?.filter(({ field, type }) => {
      const combo = `${type}.${field}`.toLowerCase();
      return (
        field?.toLowerCase().includes(q) ||
        type?.toLowerCase().includes(q) ||
        combo.includes(q)
      );
    });
  }
  if (settings.deprecatedFilter !== "off") {
    data = data?.filter((d) =>
      settings.deprecatedFilter === "include"
        ? !!d.isDeprecated
        : !d.isDeprecated
    );
  }
  const getCount = (row) => {
    const key = row?.type && row?.field ? `${row.type}.${row.field}` : null;
    return key && byFieldMap ? (byFieldMap[key]?.count ?? 0) : 0;
  };
  if (settings.countFilter !== "off") {
    data = data?.filter((d) =>
      settings.countFilter === "include" ? getCount(d) > 0 : getCount(d) === 0
    );
  }
  if (settings.sort) {
    data = orderBy(data, [settings.sort], [settings.sortDirection]);
  }

  // Panel state
  const [panel, setPanel] = useState({
    open: false,
    key: null,
    type: null,
    field: null,
    isDeprecated: false,
  });

  const clientUsage = useMemo(() => {
    const list = [];
    const k = panel.key;
    if (!k || !Array.isArray(byClient)) return list;

    for (const c of byClient) {
      const { clientId, fields } = c || {};
      if (!clientId || !Array.isArray(fields)) continue;

      const match = fields.find((f) => `${f.type}.${f.field}` === k);
      const cnt = match?.count ?? 0;
      if (cnt > 0) {
        list.push({ clientId, count: cnt });
      }
    }
    list.sort(
      (a, b) =>
        b.count - a.count ||
        String(a.clientId).localeCompare(String(b.clientId))
    );
    return list;
  }, [panel.key, byClient]);

  const totalCount =
    panel.key && byFieldMap ? (byFieldMap[panel.key]?.count ?? 0) : 0;

  function handleSelectRow(r) {
    const key = r?.type && r?.field ? `${r.type}.${r.field}` : null;
    if (!key) return;
    setPanel({
      open: true,
      key,
      type: r.type,
      field: r.field,
      isDeprecated: !!r.isDeprecated,
    });
  }

  // === Refs + simpel dynamisk offset under ikke-fixed header ===
  const shellRef = useRef(null);
  const headerRef = useRef(null);

  useLayoutEffect(() => {
    function updateOffset() {
      const shell = shellRef.current;
      const headerEl =
        headerRef.current ||
        document.querySelector("[data-header-root]") ||
        document.querySelector("header");

      if (!shell) return;

      let offset = 0;
      if (headerEl) {
        const rect = headerEl.getBoundingClientRect();
        offset = Math.max(0, Math.floor(rect.bottom));
      }
      shell.style.setProperty("--canvas-offset-top", `${offset}px`);
    }

    updateOffset();

    const ro = new ResizeObserver(updateOffset);
    if (headerRef.current) ro.observe(headerRef.current);

    window.addEventListener("scroll", updateOffset, { passive: true });
    window.addEventListener("resize", updateOffset, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", updateOffset);
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  return (
    <>
      {/* Wrap Header så vi kan måle den på siden */}
      <div data-header-root ref={headerRef}>
        <Header />
      </div>

      <div
        ref={shellRef}
        className={shellStyles.shell}
        data-open={panel.open ? "true" : "false"}
      >
        <div className={shellStyles.canvasSpacer} aria-hidden />

        <div className={shellStyles.main}>
          <Layout className={styles.container}>
            <Row>
              <Col>
                <Title as="h1" type="title6" className={styles.title}>
                  FBI-API <strong>[Insights]</strong>
                </Title>
                <Text>
                  Insights shows how our GraphQL API is used in practice, per
                  client and per field. Choose a period, sort by activity, and
                  filter to highlight deprecated or zero-usage fields. Use it to
                  verify whether specific clients still call deprecated fields
                  before you remove or migrate them.
                </Text>
              </Col>
            </Row>

            <Row className={styles.wrap}>
              <Col>
                <div className={styles.settings}>
                  <Period
                    className={styles.period}
                    value={days}
                    onChange={setDays}
                  />
                </div>

                <div className={styles.filters}>
                  <div className={styles.options}>
                    <Chip
                      mode="tri"
                      state={settings.deprecatedFilter}
                      onChange={(next) => update({ deprecatedFilter: next })}
                    >
                      {"isDeprecated"}
                    </Chip>
                    <Chip
                      mode="tri"
                      state={settings.countFilter}
                      onChange={(next) => update({ countFilter: next })}
                    >
                      {"hasCount"}
                    </Chip>
                  </div>

                  <Search onChange={(val) => update({ filter: val })} />
                </div>

                <Result data={data} onSelect={handleSelectRow} />
              </Col>
            </Row>
          </Layout>
        </div>

        <Canvas
          show={panel.open}
          onHide={() => setPanel((p) => ({ ...p, open: false }))}
          type={panel.type}
          field={panel.field}
          isDeprecated={panel.isDeprecated}
          totalCount={totalCount}
          clientUsage={clientUsage}
          container={() => shellRef.current} // Offcanvas renderes inde i shell
        />
      </div>
    </>
  );
}
