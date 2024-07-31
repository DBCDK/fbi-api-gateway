import { useMemo } from "react";

import styles from "./Diff.module.css";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import diff from "./diff";

export default function Diff() {
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
      "Deprecated fields that were removed; the type/fields after the arrow refer to alternative options.",
    TO_UPPERCASE_ENUM_VALUES:
      "Enum types whose values were changed from lowercase to UPPERCASE.",
    TYPES_TO_PASCALCASE: "Types that were changed to PascalCase.",
    TYPES_TO_PASCALCASE_NAMECHANGE:
      "Types that were renamed and changed to PascalCase.",
    TAILED_INPUT: "Input types that have the suffix 'Input' added.",
    TAILED_SCALAR: "Scalar types that have the suffix 'Scalar' added.",
    TAILED_INTERFACE: "Interface types that have the suffix 'Interface' added.",
    TAILED_UNION: "Union types that have the suffix 'Union' added.",
    TAILED_ENUM: "Enum types that have the suffix 'Enum' added.",
  };

  return (
    <div className={styles.container}>
      {Object.entries(diff).map(([k, v]) => {
        if (v.length > 0) {
          return (
            <section key={k}>
              <div className={styles.title}>{titleMap[k]}</div>
              <div className={styles.wrap}>
                <ul>
                  {v.map(({ from, to }) => {
                    const fromHasDot = from.includes(".");
                    const toHasDot = to?.includes(".");

                    const fromArr = from?.split(".");
                    const fromType = fromHasDot ? fromArr[0] : from;
                    const fromField = fromHasDot && fromArr[1];

                    const toArr = to?.split(".");
                    const toType = toHasDot ? toArr[0] : to;
                    const toField = toHasDot && toArr[1];

                    const hasAccess = fromHasDot
                      ? map?.[fromType]?.fields?.find(
                          ({ name }) => name === fromField
                        ) ||
                        map?.[fromType]?.enumValues?.find(
                          ({ name }) => name === fromField
                        )
                      : map[fromType];

                    if (!hasAccess) {
                      return null;
                    }

                    const tail = to ? <strong>{to}</strong> : " was removed";
                    const style = to ? styles.change : styles.del;

                    return (
                      <li className={style} key={from}>
                        <span>
                          {fromHasDot ? (
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
                      </li>
                    );
                  })}
                </ul>
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
