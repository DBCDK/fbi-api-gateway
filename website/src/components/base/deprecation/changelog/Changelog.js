import { useMemo } from "react";
import Table from "react-bootstrap/Table";

import { daysBetween } from "@/components/utils";

import data from "./data.json";

import styles from "./Changelog.module.css";

/**
 *
 * @param {*} str
 * @returns {string}
 *
 * converts european readable date (dd/mm-yyyy) to UTC string
 */
function localDateToUTC(str) {
  try {
    const arr = str.split("-");
    const y = arr[1];
    const arr2 = arr[0].split("/");
    const d = arr2[0];
    const m = arr2[1];
    return new Date(y, m, d);
  } catch (e) {
    return str;
  }
}

/**
 *
 * @param {*} str
 * @returns {string}
 *
 * Converts UTC timestring to only use y/m/d
 *
 */
function reformatUTC(str) {
  var y = str.getFullYear();
  var m = str.getMonth() + 1;
  var d = str.getDate();
  return new Date(y, m, d);
}

/**
 *
 * @param {string} param.expired
 * @param {string} param.deprecated
 *
 * @returns {string
 */
function getStatusClass({ expired, deprecated }) {
  const expDays = daysBetween(localDateToUTC(expired), reformatUTC(new Date()));
  const depDays = daysBetween(
    localDateToUTC(deprecated),
    reformatUTC(new Date())
  );

  if (depDays >= 0 || expDays >= 90) {
    return "expire-more-or-eq-to-90-days";
  }
  if (expDays >= 15) {
    return "expire-more-or-eq-to-15-days";
  }
  if (expDays < 15) {
    return "expire-less-than-15-days";
  }
}

export default function Changelog() {
  // Expired fields
  const expired = useMemo(
    () =>
      [...data]
        .filter(
          ({ expired }) => reformatUTC(new Date()) > localDateToUTC(expired)
        )
        .sort((a, b) => localDateToUTC(b.expired) - localDateToUTC(a.expired)),
    [data]
  );

  // Expirering fields
  const expirering = useMemo(
    () =>
      [...data]
        .filter(
          ({ expired }) => reformatUTC(new Date()) < localDateToUTC(expired)
        )
        .sort((a, b) => localDateToUTC(a.expired) - localDateToUTC(b.expired)),
    [data]
  );

  return (
    <Table className={styles.table} responsive="md">
      <thead>
        <tr>
          <th>#</th>
          <th>Field</th>
          <th>Reason</th>
          <th>Deprecated</th>
          <th>Expires/Expired</th>
        </tr>
      </thead>

      <tbody className={styles.body}>
        {expirering.map((d, idx) => (
          <tr className={styles[getStatusClass(d)]}>
            <td>{idx + 1}</td>
            {Object.values(d).map((v) => (
              <td>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>

      {expired.length > 0 && (
        <>
          <br />

          <tr className={styles.separator}>
            <td colSpan={5}> Expired: </td>
          </tr>

          <tbody className={styles.body}>
            {expired.map((d, idx) => (
              <tr className={styles[getStatusClass(d)]}>
                <td>{idx + 1}</td>
                {Object.values(d).map((v) => (
                  <td>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </>
      )}
    </Table>
  );
}
