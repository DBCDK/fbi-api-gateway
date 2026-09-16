// views/insights/Insights.jsx
import { useMemo, useState, useCallback, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { orderBy } from "lodash";

import useSchema from "@/hooks/useSchema";
import useInsights from "@/hooks/useInsights";
import useEffectiveSelectedCredential from "@/hooks/credentials/useEffectiveSelectedCredential";

import {
  buildArgumentTemplates,
  buildInputFieldTemplates,
  buildTemplates,
  getFields,
} from "./utils";

import Header from "@/components/header";
import Link from "@/components/base/link";
import Title from "@/components/base/title";
import Text from "@/components/base/text";
import Chip from "../base/chip";

import Search from "./search";
import Result from "./result";
import Period from "./period";

// IMPORTANT: as requested
import Canvas from "./canvas";

import styles from "./Insights.module.css";

const SCOPE_UI = {
  fields: { label: "Field", buildTemplates },
  arguments: { label: "Argument", buildTemplates: buildArgumentTemplates },
  inputFields: {
    label: "Input field",
    buildTemplates: buildInputFieldTemplates,
  },
};

function subtractCalendarMonths(date, months) {
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
}

function getPeriodRange({ amount, unit }) {
  const end = new Date();
  const start = new Date(end);

  if (unit === "weeks") start.setUTCDate(start.getUTCDate() - amount * 7);
  else if (unit === "months") subtractCalendarMonths(start, amount);
  else if (unit === "years") subtractCalendarMonths(start, amount * 12);
  else start.setUTCDate(start.getUTCDate() - amount);

  const format = new Intl.DateTimeFormat("da-DK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return {
    from: start.toISOString(),
    to: null,
    label: `${format.format(start)} – now`,
  };
}

/* ========================= UI (presentation) ========================= */
function InsightsUI({
  data,
  byFieldMap,
  scope,
  dimensionFilters,
  period,
  periodLabel,
  settings,
  panel,
  clientUsage,
  isInitialLoading,
  isClientLoading,
  error,
  onPeriodChange,
  onUpdateSettings,
  onScopeChange,
  onDimensionFiltersChange,
  onSelectRow,
  onClosePanel,
  onFilterClient,
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
              onFilterClient={onFilterClient}
              elementKey={panel?.key}
              elementLabel={SCOPE_UI[scope].label}
              isDeprecated={panel?.isDeprecated}
              isDraft={panel?.isDraft}
              clientUsage={clientUsage}
              isLoading={isClientLoading}
            />
          </div>
        </aside>

        {/* INDHOLD */}
        <div className={styles.content}>
          <Container fluid>
            <Row className={styles.pageGrid}>
              <Col className={styles.pageSpacer} aria-hidden="true" />
              <Col className={styles.main}>
                <div className={styles.intro}>
                  <Title as="h1" type="title6" className={styles.title}>
                    FBI-API <strong>[Insights]</strong>
                  </Title>
                  <Text>
                    Insights shows how clients use the FBI API across GraphQL
                    fields, arguments, and input fields. Choose a time range,
                    compare activity, and filter by schema status or client
                    context to understand adoption and identify unused or
                    deprecated API surface.
                  </Text>
                  <Text>
                    <Link href="/documentation#h1-insights-a31ukb" underline>
                      Learn how Insights data is collected and counted.
                    </Link>
                  </Text>
                </div>

                <div className={styles.controls}>
                  <div className={styles.settings}>
                    <Period
                      className={styles.period}
                      value={period}
                      title={periodLabel}
                      onChange={onPeriodChange}
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
                        state={settings?.draftFilter}
                        onChange={(next) =>
                          onUpdateSettings({ draftFilter: next })
                        }
                      >
                        {"isDraft"}
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
                      value={settings?.filter || ""}
                      scope={scope}
                      filters={dimensionFilters}
                      onChange={(val) => onUpdateSettings({ filter: val })}
                      onScopeChange={onScopeChange}
                      onFiltersChange={onDimensionFiltersChange}
                    />
                  </div>
                </div>

                <div
                  className={styles.results}
                  aria-busy={isInitialLoading ? "true" : "false"}
                >
                  {error && (
                    <Text className={styles.error}>
                      Insights kunne ikke hentes: {error.message}
                    </Text>
                  )}
                  {isInitialLoading && (
                    <div className={styles.loadingOverlay}>Loading…</div>
                  )}

                  <Result
                    data={data}
                    byFieldMap={byFieldMap}
                    onSelect={onSelectRow}
                    elementLabel={SCOPE_UI[scope].label}
                  />
                </div>
              </Col>
            </Row>
          </Container>

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
  const { effectiveCredential } = useEffectiveSelectedCredential();
  const { json } = useSchema(effectiveCredential);
  const [scope, setScope] = useState("fields");
  const [dimensionFilters, setDimensionFilters] = useState({
    clientId: { mode: "off", value: "" },
    agencyId: { mode: "off", value: "" },
    profileName: { mode: "off", value: "" },
  });

  const schemaElements = useMemo(() => getFields(json), [json]);
  const baseData = useMemo(
    () => SCOPE_UI[scope].buildTemplates(schemaElements),
    [schemaElements, scope]
  );

  const [period, setPeriod] = useState({ amount: 3, unit: "days" });
  const [periodRange, setPeriodRange] = useState({
    from: "",
    to: null,
    label: "",
  });

  useEffect(() => {
    setPeriodRange(getPeriodRange(period));
  }, [period]);

  // Panel
  const [panel, setPanel] = useState({
    open: false,
    key: null,
    isDeprecated: false,
    isDraft: false,
  });

  const { byFieldMap, clientUsage, isInitialLoading, isClientLoading, error } =
    useInsights(effectiveCredential, {
      from: periodRange.from,
      to: periodRange.to,
      scope,
      elementKey: panel.open ? panel.key : null,
      ...dimensionFilters,
    });

  const [settings, setSettings] = useState({
    filter: null,
    sort: null,
    sortDirection: "asc",
    deprecatedFilter: "off",
    draftFilter: "off",
    countFilter: "off",
  });
  const updateSettings = useCallback(
    (patch) => setSettings((s) => ({ ...s, ...patch })),
    []
  );

  // 2) Slank getCount der ikke alokerer nye strings unødigt
  const getCount = useCallback(
    (row) => {
      if (!row?.path || !byFieldMap) return 0;
      const hit = byFieldMap[row.path];
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
      out = out.filter(({ path }) => path?.toLowerCase().includes(q));
    }

    // deprecated
    if (settings.deprecatedFilter !== "off") {
      const inc = settings.deprecatedFilter === "include";
      out = out.filter((d) => (inc ? !!d.isDeprecated : !d.isDeprecated));
    }

    // draft
    if (settings.draftFilter !== "off") {
      const inc = settings.draftFilter === "include";
      out = out.filter((d) => (inc ? !!d.isDraft : !d.isDraft));
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

  const handleSelectRow = useCallback((r) => {
    if (!r?.path) return;
    setPanel({
      open: true,
      key: r.path,
      isDeprecated: !!r.isDeprecated,
      isDraft: !!r.isDraft,
    });
  }, []);

  const handleScopeChange = useCallback((nextScope) => {
    if (!SCOPE_UI[nextScope]) return;
    setScope(nextScope);
    setPanel((current) => ({ ...current, open: false, key: null }));
  }, []);

  const handleClosePanel = useCallback(
    () => setPanel((p) => ({ ...p, open: false })),
    []
  );

  const handleFilterClient = useCallback((clientId) => {
    setDimensionFilters((current) => ({
      ...current,
      clientId: { mode: "include", value: clientId },
    }));
    setPanel((current) => ({ ...current, open: false }));
  }, []);

  return (
    <InsightsUI
      data={data}
      byFieldMap={byFieldMap}
      scope={scope}
      dimensionFilters={dimensionFilters}
      period={period}
      periodLabel={periodRange.label}
      settings={settings}
      panel={panel}
      clientUsage={clientUsage}
      isInitialLoading={isInitialLoading}
      isClientLoading={isClientLoading}
      error={error}
      onPeriodChange={setPeriod}
      onUpdateSettings={updateSettings}
      onScopeChange={handleScopeChange}
      onDimensionFiltersChange={setDimensionFilters}
      onSelectRow={handleSelectRow}
      onClosePanel={handleClosePanel}
      onFilterClient={handleFilterClient}
    />
  );
}
