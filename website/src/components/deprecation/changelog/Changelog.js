import { useMemo } from "react";
import Table from "react-bootstrap/Table";

import { daysBetween } from "@/components/utils";

// import data from "./data.json";

import styles from "./Changelog.module.css";
import useSchema from "@/hooks/useSchema";
import useStorage from "@/hooks/useStorage";

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

function getKind(obj) {
  switch (obj?.kind) {
    case "OBJECT":
    case "INTERFACE":
      return "fields";
    case "INPUT_OBJECT":
      return "inputFields";
    case "ENUM":
      return "enumValues";
    case "SCALAR":
    case "UNION":
      return null;
    default:
      return null;
  }
}

function selectArgFields(arg) {
  if (!arg) {
    return [];
  }

  const split = arg?.deprecationReason?.split("expires:");
  const expires = split?.[1]?.trim() || null;
  const deprecationReason = split?.[0]?.trim() || null;

  return {
    name: arg?.name,
    type: arg?.type,
    expires,
    isDeprecated: arg?.isDeprecated,
    deprecationReason,
  };
}

// combines the the type/field to a changelog obj structure
function selectFields(type, field) {
  const split = field?.deprecationReason?.split("expires:");
  const expires = split?.[1]?.trim() || null;
  const deprecationReason = split?.[0]?.trim() || null;

  return {
    type: { name: type?.name, kind: type?.kind },
    field: {
      name: field?.name,
      type: field?.type,
      expires,
      args: field.args
        ?.filter((a) => a.isDeprecated)
        .map((arg) => selectArgFields(arg)),
      isDeprecated: field?.isDeprecated,
      deprecationReason,
    },
  };
}

function getDeprecatedFields(json) {
  const arr = [];

  if (!json?.data) {
    return arr;
  }

  const types = json.data.__schema?.types;
  types?.forEach((obj) => {
    const target = getKind(obj);

    if (target) {
      const hits = [];
      obj?.[target]?.forEach((field) => {
        if (field.isDeprecated) {
          hits.push(field);
        }
        field.args?.forEach(
          (arg) => arg.isDeprecated && hits.push({ ...field, args: [arg] })
        );
      });

      if (hits.length) {
        hits.forEach((hit) => arr.push(selectFields(obj, hit)));
      }
    }
  });

  return arr;
}

function buildTemplates(data) {
  if (!data || !data.length) {
    return [];
  }

  const temps = [];
  data.forEach(({ type, field }) => {
    const base = {
      kind: type.kind,
      type: type.name,
      field: field.name,
      reason: field.deprecationReason,
      expires: field.expires,
    };

    if (field.isDeprecated) {
      temps.push(base);
    } else {
      field.args?.forEach((args) =>
        temps.push({
          ...base,
          argument: args.name,
          reason: args.deprecationReason,
          expires: args.expires,
        })
      );
    }
  });

  return temps;
}

export default function Changelog() {
  const { selectedToken } = useStorage();
  const { json } = useSchema(selectedToken);

  const data = buildTemplates(getDeprecatedFields(json));

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
              {d.argument && <i>{d.argument}</i>}
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
