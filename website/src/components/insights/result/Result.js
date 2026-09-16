// views/insights/result.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Table } from "react-bootstrap";
import styles from "./Result.module.css";

const COL = {
  FIELD: "field",
  STATUS: "status",
  COUNT: "count",
  LAST_USED: "lastUsed",
};

const DEFAULT_DIR = {
  [COL.FIELD]: "asc",
  [COL.STATUS]: "asc",
  [COL.COUNT]: "desc",
  [COL.LAST_USED]: "desc",
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatLastUsed(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatLastUsedTitle(value) {
  if (!value) return "No recorded usage";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${dateTimeFormatter.format(date)} UTC`;
}

function nextDir(currentKey, currentDir, clickedKey) {
  if (currentKey !== clickedKey) return DEFAULT_DIR[clickedKey];
  const def = DEFAULT_DIR[clickedKey];
  if (currentDir === def) return def === "asc" ? "desc" : "asc";
  if (currentDir === (def === "asc" ? "desc" : "asc")) return "off";
  return def;
}

/**
 * Result-table
 * @param {{
 *   data: Array<any>,
 *   byFieldMap: Record<string,{count:number}>,
 *   onSelect?: (row:any)=>void
 * }} props
 */
export default function Result({
  data,
  byFieldMap,
  onSelect,
  elementLabel = "Field",
}) {
  const [sort, setSort] = useState({ key: COL.COUNT, dir: "desc" });

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((obj, idx) => {
      const { field, type, path } = obj || {};
      const key = path || (type && field ? `${type}.${field}` : null);
      const count = key && byFieldMap ? (byFieldMap[key]?.count ?? 0) : 0;
      const lastSeen = key && byFieldMap ? byFieldMap[key]?.lastSeen : null;
      return {
        ...obj,
        __key: key || `${idx}-${field}`,
        __count: count,
        __lastSeen: lastSeen || null,
        __lastUsedTimestamp: lastSeen ? Date.parse(lastSeen) : null,
        __index: idx,
        __fieldLabel: key ? String(key) : "",
      };
    });
  }, [data, byFieldMap]);

  const sorted = useMemo(() => {
    if (!rows.length) return rows;
    const { key, dir } = sort;
    if (!key || dir === "off") return rows.slice();

    const arr = rows.slice();
    const sign = dir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      const byFieldAsc =
        a.__fieldLabel.localeCompare(b.__fieldLabel) || a.__index - b.__index;

      switch (key) {
        case COL.FIELD: {
          const cmp = a.__fieldLabel.localeCompare(b.__fieldLabel);
          return sign * (cmp || a.__index - b.__index);
        }
        case COL.STATUS: {
          const av = a?.isDraft ? 2 : a?.isDeprecated ? 1 : 0;
          const bv = b?.isDraft ? 2 : b?.isDeprecated ? 1 : 0;
          const cmp = av - bv;
          return sign * (cmp || byFieldAsc);
        }
        case COL.COUNT: {
          const cmp = a.__count - b.__count;
          return sign * (cmp || byFieldAsc);
        }
        case COL.LAST_USED:
        default: {
          const av = a.__lastUsedTimestamp;
          const bv = b.__lastUsedTimestamp;
          if (!Number.isFinite(av) && !Number.isFinite(bv)) return byFieldAsc;
          if (!Number.isFinite(av)) return 1;
          if (!Number.isFinite(bv)) return -1;
          return sign * (av - bv || byFieldAsc);
        }
      }
    });

    return arr;
  }, [rows, sort]);

  function onHeaderClick(colKey) {
    setSort((s) => ({ key: colKey, dir: nextDir(s.key, s.dir, colKey) }));
  }

  const isActive = (colKey) => sort.key === colKey && sort.dir !== "off";
  const ariaSort = (colKey) =>
    isActive(colKey)
      ? sort.dir === "asc"
        ? "ascending"
        : "descending"
      : "none";
  const thClass = (colKey) =>
    [
      styles.th,
      isActive(colKey) ? styles.thActive : "",
      isActive(colKey) && sort.dir === "asc" ? styles.thAsc : "",
      isActive(colKey) && sort.dir === "desc" ? styles.thDesc : "",
    ]
      .filter(Boolean)
      .join(" ");

  // ==== Sticky top-border når headeren er “stuck” ====
  const wrapRef = useRef(null);
  const sentinelRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const sentinel = sentinelRef.current;
    if (!wrap || !sentinel) return;

    const header = document.querySelector("[data-page-header]");
    let intersectionObserver;
    let animationFrame;

    const observeSentinel = () => {
      intersectionObserver?.disconnect();

      const cs = getComputedStyle(wrap);
      const gapVar = cs.getPropertyValue("--gap-height").trim() || "12px";
      const gap = parseFloat(gapVar) || 12;
      const headerHeight = header?.getBoundingClientRect().height || 68;
      const offset = Math.ceil(headerHeight) + gap;

      intersectionObserver = new IntersectionObserver(
        ([entry]) => setStuck(!entry.isIntersecting),
        {
          root: null,
          rootMargin: `-${offset}px 0px 0px 0px`,
          threshold: 0,
        }
      );
      intersectionObserver.observe(sentinel);
    };

    const scheduleObservation = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(observeSentinel);
    };

    observeSentinel();

    const resizeObserver = new ResizeObserver(scheduleObservation);
    if (header) resizeObserver.observe(header);
    resizeObserver.observe(wrap);
    window.addEventListener("resize", scheduleObservation);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleObservation);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.tableWrap}
      data-stuck={stuck ? "true" : "false"}
    >
      {/* Static sentinel (ikke sticky) før stickyGap:
          Når denne passerer offset, sætter vi data-stuck="true" */}
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden />

      {/* Sticky spacer: ren hvid luft under topbaren */}
      <div className={styles.stickyGap} aria-hidden />

      {/* Indre frame: kant/radius starter først under gap'et */}
      <div className={styles.frame}>
        <Table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th} aria-sort="none" title="Row number">
                #
              </th>

              <th
                role="button"
                onClick={() => onHeaderClick(COL.FIELD)}
                className={thClass(COL.FIELD)}
                data-sort-active={isActive(COL.FIELD)}
                data-sort-dir={isActive(COL.FIELD) ? sort.dir : "off"}
                aria-sort={ariaSort(COL.FIELD)}
                title={`Sort by ${elementLabel} (a–z / z–a / off)`}
              >
                {elementLabel}
              </th>

              <th
                role="button"
                onClick={() => onHeaderClick(COL.STATUS)}
                className={thClass(COL.STATUS)}
                data-sort-active={isActive(COL.STATUS)}
                data-sort-dir={isActive(COL.STATUS) ? sort.dir : "off"}
                aria-sort={ariaSort(COL.STATUS)}
                title="Sort by schema status"
              >
                Status
              </th>

              <th
                role="button"
                onClick={() => onHeaderClick(COL.COUNT)}
                className={thClass(COL.COUNT)}
                data-sort-active={isActive(COL.COUNT)}
                data-sort-dir={isActive(COL.COUNT) ? sort.dir : "off"}
                aria-sort={ariaSort(COL.COUNT)}
                title="Sort by Count (low/high)"
              >
                Count
              </th>

              <th
                role="button"
                onClick={() => onHeaderClick(COL.LAST_USED)}
                className={thClass(COL.LAST_USED)}
                data-sort-active={isActive(COL.LAST_USED)}
                data-sort-dir={isActive(COL.LAST_USED) ? sort.dir : "off"}
                aria-sort={ariaSort(COL.LAST_USED)}
                title="Sort by last used (newest/oldest/off)"
              >
                Last used
              </th>
            </tr>
          </thead>

          <tbody className={styles.body}>
            {sorted.map((r, idx) => {
              const {
                isDeprecated,
                isDraft,
                description,
                __key,
                __count,
                __lastSeen,
                __fieldLabel,
              } = r || {};
              const separator = __fieldLabel.lastIndexOf(".");
              const prefix = __fieldLabel.slice(0, separator);
              const name = __fieldLabel.slice(separator + 1);
              return (
                <tr
                  key={__key}
                  className={styles.result}
                  title={description || ""}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(r);
                    }
                  }}
                >
                  <td>{idx + 1}</td>
                  <td>
                    {prefix && <span className={styles.type}>{prefix}</span>}
                    {prefix && "."}
                    {name}
                  </td>
                  <td>
                    {isDraft ? "draft" : isDeprecated ? "deprecated" : "active"}
                  </td>
                  <td>{__count}</td>
                  <td className={styles.lastUsed}>
                    <time
                      dateTime={__lastSeen || undefined}
                      title={formatLastUsedTitle(__lastSeen)}
                    >
                      {formatLastUsed(__lastSeen)}
                    </time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
