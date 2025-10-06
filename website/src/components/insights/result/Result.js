// views/insights/result.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Table } from "react-bootstrap";
import styles from "./Result.module.css";

const COL = {
  FIELD: "field",
  DEPRECATED: "deprecated",
  COUNT: "count",
};

const DEFAULT_DIR = {
  [COL.FIELD]: "asc",
  [COL.DEPRECATED]: "asc",
  [COL.COUNT]: "desc",
};

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
export default function Result({ data, byFieldMap, onSelect }) {
  const [sort, setSort] = useState({ key: COL.COUNT, dir: "desc" });

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((obj, idx) => {
      const { field, type } = obj || {};
      const key = type && field ? `${type}.${field}` : null;
      const count = key && byFieldMap ? (byFieldMap[key]?.count ?? 0) : 0;
      return {
        ...obj,
        __key: key || `${idx}-${field}`,
        __count: count,
        __index: idx,
        __fieldLabel: type && field ? `${String(type)}.${String(field)}` : "",
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
        case COL.DEPRECATED: {
          const av = a?.isDeprecated ? 1 : 0;
          const bv = b?.isDeprecated ? 1 : 0;
          const cmp = av - bv;
          return sign * (cmp || byFieldAsc);
        }
        case COL.COUNT:
        default: {
          const cmp = a.__count - b.__count;
          return sign * (cmp || byFieldAsc);
        }
      }
    });

    return arr;
  }, [rows, sort]);

  function onHeaderClick(colKey) {
    setSort((s) => ({ key: colKey, dir: nextDir(s.key, s.dir, colKey) }));
  }

  function renderSortIcon(colKey) {
    if (sort.key !== colKey || sort.dir === "off") return null;
    return sort.dir === "asc" ? " ↑" : " ↓";
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

    // Læs --gap-height (px) fra CSS for korrekt offset
    const cs = getComputedStyle(wrap);
    const gapVar = cs.getPropertyValue("--gap-height").trim() || "12px";
    const gap = parseFloat(gapVar) || 12;

    const TOP_BAR = 68; // din sticky header-højde
    const offset = TOP_BAR + gap; // samme som sticky top på thead

    const io = new IntersectionObserver(
      ([entry]) => {
        // når sentinel passerer offset, er headeren stuck
        setStuck(!entry.isIntersecting);
      },
      {
        root: null, // viewport
        rootMargin: `-${offset}px 0px 0px 0px`,
        threshold: 0,
      }
    );

    io.observe(sentinel);
    return () => io.disconnect();
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
                title="Sort by Field (a–z / z–a / off)"
              >
                Field {renderSortIcon(COL.FIELD)}
              </th>

              <th
                role="button"
                onClick={() => onHeaderClick(COL.DEPRECATED)}
                className={thClass(COL.DEPRECATED)}
                data-sort-active={isActive(COL.DEPRECATED)}
                data-sort-dir={isActive(COL.DEPRECATED) ? sort.dir : "off"}
                aria-sort={ariaSort(COL.DEPRECATED)}
                title="Sort by Deprecated (false/true)"
              >
                Deprecated {renderSortIcon(COL.DEPRECATED)}
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
                Count {renderSortIcon(COL.COUNT)}
              </th>
            </tr>
          </thead>

          <tbody className={styles.body}>
            {sorted.map((r, idx) => {
              const { field, type, isDeprecated, description, __key, __count } =
                r || {};
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
                    <span className={styles.type}>{type}</span>.{field}
                  </td>
                  <td>{isDeprecated ? "true" : "false"}</td>
                  <td>{__count}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
