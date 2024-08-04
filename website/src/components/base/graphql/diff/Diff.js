import { useMemo } from "react";
import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import diff from "./diff";
import useUsage from "@/hooks/useUsage";
import useConfiguration from "@/hooks/useConfiguration";

import styles from "./Diff.module.css";

function Li({ from, to, note }) {
  const { selectedToken } = useStorage();
  const { configuration = {} } = useConfiguration(selectedToken);

  const { agency, clientId } = configuration;

  const fromHasDot = from.includes(".");
  const fromArr = from?.split(".");
  const fromType = fromHasDot ? fromArr[0] : from;
  const fromField = fromHasDot && fromArr[1];

  const options = {
    days: 30,
    q: fromHasDot ? fromField : from,
    agencyId: agency,
    profile: selectedToken.profile,
    clientId,
  };

  const { isUsed, timestamp, stringQuery, operationName, isLoading } = useUsage(
    selectedToken,
    options
  );

  const toHasDot = to?.includes(".");
  const toArr = to?.split(".");
  const toType = toHasDot ? toArr[0] : to;
  const toField = toHasDot && toArr[1];

  const tail = to ? <strong>{to}</strong> : " was removed";
  const style = to ? styles.change : styles.del;

  const ignoreStyle = !isUsed && !isLoading ? styles.ignore : "";
  // ⏳
  return (
    <li className={`${style} ${ignoreStyle}`}>
      {isLoading && <div className={styles.spinner}> </div>}
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
      {note && <i className={styles.note}>{` ${note}`}</i>}
    </li>
  );
}

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

  return (
    <div className={styles.container}>
      {Object.entries(diff).map(([k, v]) => {
        if (v.length > 0) {
          return (
            <section key={k}>
              <div className={styles.title}>{titleMap[k]}</div>
              <div className={styles.wrap}>
                <ul>
                  {v.map((obj) => {
                    const { from } = obj;

                    const hasDot = from.includes(".");
                    const arr = from?.split(".");
                    const type = hasDot ? arr[0] : from;
                    const field = hasDot && arr[1];

                    const hasAccess = hasDot
                      ? map?.[type]?.fields?.find(
                          ({ name }) => name === field
                        ) ||
                        map?.[type]?.enumValues?.find(
                          ({ name }) => name === field
                        )
                      : map[type];

                    if (!hasAccess) {
                      return null;
                    }

                    return <Li key={from} {...obj} />;
                  })}
                </ul>
              </div>
            </section>
          );
        }
      })}

      <hr />

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
