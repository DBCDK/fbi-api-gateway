import { useMemo } from "react";
import Table from "react-bootstrap/Table";

import { daysBetween } from "@/components/utils";

import styles from "./Changelog.module.css";
import useSchema from "@/hooks/useSchema";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import Text from "@/components/base/text";
import Spinner from "@/components/base/spinner/Spinner";
import { getChangelogEntries } from "../logUtils";

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
 * @returns {string}
 */
function getStatusClass({ expires }) {
  const expDays = daysBetween(localDateToUTC(expires), reformatUTC(new Date()));

  if (expDays >= 90) {
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
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { json, isLoading } = useSchema(selectedToken);

  const data = getChangelogEntries(json);

  // Expired fields
  const expired = useMemo(
    () =>
      [...data]
        .filter(
          ({ expires }) => reformatUTC(new Date()) >= localDateToUTC(expires)
        )
        .sort((a, b) => localDateToUTC(b.expires) - localDateToUTC(a.expires)),
    [data]
  );

  // Expirering fields
  const expirering = useMemo(
    () =>
      [...data]
        .filter(
          ({ expires }) => reformatUTC(new Date()) < localDateToUTC(expires)
        )
        .sort((a, b) => localDateToUTC(a.expires) - localDateToUTC(b.expires)),
    [data]
  );

  if (!data.length && isLoading) {
    return (
      <Text>
        ... Searching for deprecated fields{" "}
        <Spinner className={styles.spinner} />
      </Text>
    );
  }

  if (!data.length && !selectedToken?.token && !isLoading) {
    return <Text>... Provide a token to watch the changelog 🔑</Text>;
  }

  if (!data.length && !isLoading) {
    return <Text>... Currently no deprecated fields 🤸</Text>;
  }

  return (
    <Table className={styles.table} responsive="md">
      <thead>
        <tr>
          <th>#</th>
          <th>Path</th>
          <th>Reason / Alternative</th>
          <th>Expires / Expired</th>
        </tr>
      </thead>

      <tbody className={styles.body}>
        {expirering.map((d, idx) => (
          <tr
            key={`expirering-${d.field}-${idx}`}
            className={styles[getStatusClass(d)]}
          >
            <td>{idx + 1}</td>
            <td>
              <strong>{d.type}</strong>
              <span>.{d.field}</span>
              {d.argument && (
                <span>
                  <span>argument</span>
                  <i>{d.argument}</i>
                </span>
              )}
            </td>
            <td>{d.reason}</td>
            <td>{d.expires}</td>
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
              <tr
                key={`expired-${d.field}-${idx}`}
                className={styles[getStatusClass(d)]}
              >
                <td>{idx + 1}</td>
                <td>
                  <strong>{d.type}</strong>
                  <span>.{d.field}</span>
                  {d.argument && (
                    <span>
                      <span>argument</span>
                      <i>{d.argument}</i>
                    </span>
                  )}
                </td>
                <td>{d.reason}</td>
                <td>{d.expires}</td>
              </tr>
            ))}
          </tbody>
        </>
      )}
    </Table>
  );
}
