import { useMemo } from "react";

import styles from "./Diff.module.css";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import diff from "./diff";

export default function Diff({ options }) {
  const url = useGraphQLUrl("https://fbi-api.dbc.dk");
  const { selectedToken } = useStorage();
  const { json: remoteSchema } = useSchema(selectedToken, url);

  const types = remoteSchema?.data?.__schema?.types;

  const map = useMemo(() => {
    const map = {};
    types?.forEach((obj) => (map[obj.name] = obj));
    return map;
  }, [types]);

  const titleMap = {
    DEPRECATED:
      "Deprecated fields that were removed. The type/field after the arrow refer to alternative options.",
    TO_UPPERCASE_ENUM_VALUES:
      "Enum types whose VALUES were changed from lowercase to UPPERCASE.",
    TYPES_TO_PASCALCASE: "Types that were changed to PascalCase.",
    TYPES_TO_PASCALCASE_NAMECHANGE:
      "Types that were renamed and changed to PascalCase.",
    TAILED_INPUT: "Input types that have had the suffix 'Input' added.",
    TAILED_SCALAR: "Scalar types that have had the suffix 'Scalar' added.",
    TAILED_INTERFACE:
      "Interface types that have had the suffix 'Interface' added.",
    TAILED_UNION: "Union types that have had the suffix 'Union' added.",
    TAILED_ENUM: "Enum types that have had the suffix 'Enum' added.",
  };

  // Funcion to build the html for the changes diff
  function createHtmlFields(data) {
    return data.map(({ from, to, note, ignore, affectedFields }, idx) => {
      const fromHasDot = from.includes(".");
      const toHasDot = to?.includes(".");

      const fromArr = from?.split(".");
      const fromType = fromHasDot ? fromArr[0] : from;
      const fromField = fromHasDot && fromArr[1];
      const isValues = fromHasDot && fromField?.toLowerCase() === "values";

      const toArr = to?.split(".");
      const toType = toHasDot ? toArr[0] : to;
      const toField = toHasDot && toArr[1];

      const hasAccess = true;
      fromHasDot && !isValues
        ? map?.[fromType]?.fields?.find(({ name }) => name === fromField) ||
          map?.[fromType]?.enumValues?.find(({ name }) => name === fromField)
        : map[fromType];

      if (!hasAccess) {
        return null;
      }

      const tail = to ? <strong>{to}</strong> : " was removed";
      const style = to ? styles.change : styles.del;

      const strikethrough =
        options.enabled && ignore ? styles.strikethrough : "";

      return (
        <li className={`${style} ${strikethrough}`} key={`${idx}-${from}`}>
          <span>
            {fromHasDot || isValues ? (
              <>
                <strong>{fromType}</strong>.{fromField}
              </>
            ) : (
              <strong>{from}</strong>
            )}
          </span>
          {to && <span> ➡️ </span>}
          <span>
            {toHasDot ? (
              <>
                <strong>{toType}</strong>.{toField}
              </>
            ) : (
              tail
            )}
          </span>
          {affectedFields && (
            <div>
              <p>Fields affected due to the above field deprecation</p>
              <ul>{createHtmlFields(affectedFields)}</ul>
            </div>
          )}
          {note && <i className={styles.note}>{` ${note}`}</i>}
        </li>
      );
    });
  }

  return (
    <div className={styles.container}>
      {Object.entries(diff).map(([k, v]) => {
        if (v.length > 0) {
          return (
            <section key={k}>
              <div className={styles.title}>{titleMap[k]}</div>
              <div className={styles.wrap}>
                <ul>{createHtmlFields(v)}</ul>
              </div>
            </section>
          );
        }
      })}
      <section>
        <div className={styles.title}>Other changes</div>
        <div className={styles.wrap}>
          <ul>
            {map?.["ComplexSearchSuggestion"] && (
              <li className={styles.change}>
                <span>
                  <strong>ComplexSearchSuggestion</strong>.type typeOf
                  <i> string!</i>
                </span>
                <span> ➡️ </span>
                <span>
                  typeOf <strong>ComplexSuggestionTypeEnum</strong>
                </span>
              </li>
            )}
            {map?.["FacetField"] && (
              <li className={styles.change}>
                <span>
                  <strong>FacetField</strong>.name typeOf
                  <i> string</i>
                </span>
                <span> ➡️ </span>
                <span>
                  typeOf <strong>FacetFieldEnum</strong>
                </span>
              </li>
            )}
            {map?.["Categories"] && (
              <li className={styles.change}>
                <span>
                  <strong>Categories</strong>.category
                </span>
                <span> ➡️ </span>
                <span>
                  <strong>Categories</strong>.title
                </span>
              </li>
            )}
            {map?.["Categories"] && (
              <li className={styles.del}>
                <span>
                  <strong>Query</strong>.inspiration language <i>argument</i>
                </span>
                <span> was removed</span>
              </li>
            )}
          </ul>
        </div>
      </section>
      <section>
        <div className={styles.title}>{'"Nice to know" fields added'}</div>
        <div className={styles.wrap}>
          <ul>
            {map?.["FacetResult"] && (
              <li className={styles.change}>
                <span>
                  <strong>FacetResult</strong>.type field <term>added</term>
                </span>
                <span> - </span>
                <span>holds the new (UPPERCASED) FacetFieldEnum value</span>
              </li>
            )}
            {map?.["Categories"] && (
              <li className={styles.change}>
                <span>
                  <strong>Categories</strong>.type field <term>added</term>
                </span>
                <span> - </span>
                <span>
                  holds the new (UPPERCASED) CategoryFiltersEnum value
                </span>
              </li>
            )}
            {map?.["UserParameter"] && (
              <li className={styles.change}>
                <span>
                  <strong>UserParameter</strong>.userParameterName field
                  <term> added</term>
                </span>
                <span> - </span>
                <span>holds the old (lowercased) userParameterType value</span>
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
