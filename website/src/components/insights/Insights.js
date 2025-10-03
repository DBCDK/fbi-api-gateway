// views/insights/Insights.jsx
import { useMemo, useState } from "react";
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
      {/* Header i normal dokument-flow */}
      <Header />

      {/* Shell: venstre sidebar med CSS-sticky panel; content skubbes via transform */}
      <div className={styles.shell} data-open={panel?.open ? "true" : "false"}>
        {/* Sidebar / Canvas (VENSTRE) — sticky med spacer */}
        <aside className={styles.sidebar} aria-live="polite">
          <div className={styles.sidebarInner}>
            {/* Spacer = headerhøjde (68px). Panelet starter under headeren */}
            <div className={styles.sidebarSpacer} aria-hidden="true" />
            {/* Sticky wrapper: hæfter ved top:0 når spacer er scrollet væk */}
            <div className={styles.panelSticky}>
              <div className={styles.canvasCard}>
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
            </div>
          </div>
        </aside>

        {/* Alt andet indhold skubbes via transform (GPU) – ikke layout */}
        <div className={styles.content}>
          <div className={styles.main}>
            <Layout className={styles.container}>
              <Row>
                <Col>
                  <Title as="h1" type="title6" className={styles.title}>
                    FBI-API <strong>[Insights]</strong>
                  </Title>
                  <Text>
                    Insights shows how our GraphQL API is used in practice, per
                    client and per field. Choose a period, sort by activity, and
                    filter to highlight deprecated or zero-usage fields. Use it
                    to verify whether specific clients still call deprecated
                    fields before you remove or migrate them.
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
                    <div className={styles.loadingOverlay} aria-live="polite">
                      Loading…
                    </div>
                  )}

                  <Result
                    data={data}
                    byFieldMap={byFieldMap}
                    onSelect={onSelectRow}
                  />
                </Col>
              </Row>
            </Layout>
          </div>

          {/* Mobil backdrop (tryk for at lukke) */}
          <button
            type="button"
            className={styles.backdrop}
            data-visible={panel?.open ? "true" : "false"}
            aria-hidden={panel?.open ? "false" : "true"}
            onClick={onClosePanel}
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
  const updateSettings = (patch) => setSettings((s) => ({ ...s, ...patch }));

  let data = useMemo(() => buildTemplates(getFields(json)), [json]);

  const getCount = (row) => {
    const key = row?.type && row?.field ? `${row.type}.${row.field}` : null;
    return key && byFieldMap ? (byFieldMap[key]?.count ?? 0) : 0;
  };

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
  if (settings.countFilter !== "off") {
    data = data?.filter((d) =>
      settings.countFilter === "include" ? getCount(d) > 0 : getCount(d) === 0
    );
  }
  if (settings.sort) {
    data = orderBy(data, [settings.sort], [settings.sortDirection]);
  }

  const [panel, setPanel] = useState({
    open: false,
    key: null,
    type: null,
    field: null,
    isDeprecated: false,
  });

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
  const handleClosePanel = () => setPanel((p) => ({ ...p, open: false }));

  const clientUsage = useMemo(() => {
    const list = [];
    const k = panel.key;
    if (!k || !Array.isArray(byClient)) return list;

    for (const c of byClient) {
      const { clientId, fields } = c || {};
      if (!clientId || !Array.isArray(fields)) continue;
      const match = fields.find((f) => `${f.type}.${f.field}` === k);
      const cnt = match?.count ?? 0;
      if (cnt > 0) list.push({ clientId, count: cnt });
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
