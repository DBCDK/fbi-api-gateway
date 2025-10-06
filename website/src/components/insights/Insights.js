// views/insights/Insights.jsx
import { useMemo, useState, useCallback } from "react";
import { Col, Row } from "react-bootstrap";
import { orderBy } from "lodash";

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

// IMPORTANT: as requested
import Canvas from "./canvas";

import styles from "./Insights.module.css";

/* ========================= UI (presentation) ========================= */
function InsightsUI({
  data,
  byFieldMap,
  days,
  settings,
  panel,
  clientUsage,
  totalCount,
  isFetching,
  onDaysChange,
  onUpdateSettings,
  onSelectRow,
  onClosePanel,
}) {
  return (
    <>
      <Header />

      <div className={styles.shell} data-open={panel?.open ? "true" : "false"}>
        {/* VENSTRE placeholder */}
        <aside className={styles.sidebar}>
          <div className={styles.canvasWrap}>
            <Canvas
              show={panel?.open}
              onHide={onClosePanel}
              type={panel?.type}
              field={panel?.field}
              isDeprecated={panel?.isDeprecated}
              totalCount={totalCount}
              clientUsage={clientUsage}
            />
          </div>
        </aside>

        {/* INDHOLD */}
        <div className={styles.content}>
          <Layout className={styles.container}>
            <Row>
              <Col>
                <Title as="h1" type="title6" className={styles.title}>
                  FBI-API <strong>[Insights]</strong>
                </Title>
                <Text>
                  Insights viser hvordan vores GraphQL API bruges i praksis –
                  per klient og per felt. Vælg periode, sortér på aktivitet, og
                  filtrér for at se deprecated eller inaktive felter.
                </Text>
              </Col>
            </Row>

            <Row className={styles.wrap}>
              <Col>
                <div className={styles.settings}>
                  <Period
                    className={styles.period}
                    value={days}
                    onChange={onDaysChange}
                  />
                </div>

                <div className={styles.filters}>
                  <div className={styles.options}>
                    <Chip
                      mode="tri"
                      state={settings?.deprecatedFilter}
                      onChange={(next) =>
                        onUpdateSettings({ deprecatedFilter: next })
                      }
                    >
                      {"isDeprecated"}
                    </Chip>
                    <Chip
                      mode="tri"
                      state={settings?.countFilter}
                      onChange={(next) =>
                        onUpdateSettings({ countFilter: next })
                      }
                    >
                      {"hasCount"}
                    </Chip>
                  </div>

                  <Search
                    onChange={(val) => onUpdateSettings({ filter: val })}
                  />
                </div>

                {isFetching && (
                  <div className={styles.loadingOverlay}>Loading…</div>
                )}

                <Result
                  data={data}
                  byFieldMap={byFieldMap}
                  onSelect={onSelectRow}
                />
              </Col>
            </Row>
          </Layout>

          {/* Backdrop (mobil) */}
          <button
            type="button"
            className={styles.backdrop}
            data-visible={panel?.open ? "true" : "false"}
            onClick={onClosePanel}
            aria-hidden={!panel?.open}
          />
        </div>
      </div>
    </>
  );
}

/* ========================= WRAP (data/state/handlers) ========================= */
export default function Insights() {
  const { selectedToken } = useStorage();
  const { json } = useSchema(selectedToken);

  // 1) Byg basisliste KUN når schema ændrer sig
  const baseData = useMemo(() => buildTemplates(getFields(json)), [json]);

  const [days, setDays] = useState(3);
  const { byFieldMap, byClient, isFetching } = useInsights(selectedToken, {
    days,
  });

  const [settings, setSettings] = useState({
    filter: null,
    sort: null,
    sortDirection: "asc",
    deprecatedFilter: "off",
    countFilter: "off",
  });
  const updateSettings = useCallback(
    (patch) => setSettings((s) => ({ ...s, ...patch })),
    []
  );

  // 2) Slank getCount der ikke alokerer nye strings unødigt
  const getCount = useCallback(
    (row) => {
      const t = row?.type;
      const f = row?.field;
      if (!t || !f || !byFieldMap) return 0;
      const k = t + "." + f;
      const hit = byFieldMap[k];
      return hit ? hit.count || 0 : 0;
    },
    [byFieldMap]
  );

  // 3) Memoisér filtrering/sortering – ændrer KUN når settings, baseData eller byFieldMap ændrer sig
  const data = useMemo(() => {
    if (!Array.isArray(baseData)) return [];

    let out = baseData;

    // filter
    if (settings.filter) {
      const q = settings.filter.toLowerCase();
      out = out.filter(({ field, type }) => {
        const combo = `${type}.${field}`.toLowerCase();
        return (
          (field && field.toLowerCase().includes(q)) ||
          (type && type.toLowerCase().includes(q)) ||
          combo.includes(q)
        );
      });
    }

    // deprecated
    if (settings.deprecatedFilter !== "off") {
      const inc = settings.deprecatedFilter === "include";
      out = out.filter((d) => (inc ? !!d.isDeprecated : !d.isDeprecated));
    }

    // count
    if (settings.countFilter !== "off") {
      const inc = settings.countFilter === "include";
      out = out.filter((d) => (inc ? getCount(d) > 0 : getCount(d) === 0));
    }

    // sort
    if (settings.sort) {
      out = orderBy(out, [settings.sort], [settings.sortDirection]);
    }

    return out;
  }, [baseData, settings, getCount]);

  // Panel
  const [panel, setPanel] = useState({
    open: false,
    key: null,
    type: null,
    field: null,
    isDeprecated: false,
  });

  const handleSelectRow = useCallback((r) => {
    if (!r?.type || !r?.field) return;
    setPanel({
      open: true,
      key: `${r.type}.${r.field}`,
      type: r.type,
      field: r.field,
      isDeprecated: !!r.isDeprecated,
    });
  }, []);

  const handleClosePanel = useCallback(
    () => setPanel((p) => ({ ...p, open: false })),
    []
  );

  // Udregn clientUsage + totalCount
  const clientUsage = useMemo(() => {
    if (!panel.key || !Array.isArray(byClient)) return [];
    const list = [];
    for (const c of byClient) {
      const { clientId, fields } = c || {};
      if (!clientId || !Array.isArray(fields)) continue;
      const m = fields.find((f) => `${f.type}.${f.field}` === panel.key);
      if (m?.count > 0) list.push({ clientId, count: m.count });
    }
    list.sort(
      (a, b) => b.count - a.count || a.clientId.localeCompare(b.clientId)
    );
    return list;
  }, [panel.key, byClient]);

  const totalCount = byFieldMap?.[panel.key]?.count ?? 0;

  return (
    <InsightsUI
      data={data}
      byFieldMap={byFieldMap}
      days={days}
      settings={settings}
      panel={panel}
      clientUsage={clientUsage}
      totalCount={totalCount}
      isFetching={isFetching}
      onDaysChange={setDays}
      onUpdateSettings={updateSettings}
      onSelectRow={handleSelectRow}
      onClosePanel={handleClosePanel}
    />
  );
}
