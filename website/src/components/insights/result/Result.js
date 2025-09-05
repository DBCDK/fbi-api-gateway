import { useMemo, useState } from "react";
import { Table } from "react-bootstrap";
import useStorage from "@/hooks/useStorage";
import useInsights from "@/hooks/useInsights";
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
 * @param {{ data: Array<any>, onSelect?: (row:any)=>void }} props
 */
export default function Result({ data, onSelect }) {
  const { selectedToken } = useStorage();
  const { byFieldMap } = useInsights(selectedToken);

  // Startsortering: Count desc
  const [sort, setSort] = useState({ key: COL.COUNT, dir: "desc" });

  // Berig rækker med hjælpefelter til sortering/visning
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
        __index: idx, // original rækkefølge
        __fieldLabel: type && field ? `${String(type)}.${String(field)}` : "",
      };
    });
  }, [data, byFieldMap]);

  // Sortér efter valgt kolonne
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
          // false < true når asc
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

  // Header klik -> cykl retning
  function onHeaderClick(colKey) {
    setSort((s) => ({ key: colKey, dir: nextDir(s.key, s.dir, colKey) }));
  }

  function renderSortIcon(colKey) {
    if (sort.key !== colKey || sort.dir === "off") return null;
    return sort.dir === "asc" ? " ↑" : " ↓";
  }

  // Hjælpere til aktiv header styling
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

  return (
    <Table className={styles.table} responsive="md">
      <thead>
        <tr>
          {/* INDEX: ikke-sortérbar */}
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
              onClick={() => onSelect?.(r)} // informér parent (Insights) om valg
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
  );
}
