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
      "Deprecated fields which was removed, type/fields after the arrow refers to alternative options",
    TO_UPPERCASE_ENUM_VALUES:
      "Enum types which VALUES was changed from lowercase to UPPERCASE",
    TYPES_TO_PASCALCASE: "Types which was changed to PascalCase",
    TYPES_TO_PASCALCASE_NAMECHANGE:
      "Types which was renamed and changed to PascalCase",
    TAILED_INPUT: "Input types which got tailed 'Input' added",
    TAILED_SCALAR: "Scalar types which got tailed 'Scalar' added",
    TAILED_INTERFACE: "Interface types which got tailed 'Interface' added",
    TAILED_UNION: "Union types which got tailed 'Union' added",
    TAILED_ENUM: "Enum types which got tailed 'Enum' added",
  };

  return (
    <div className={styles.container}>
      {Object.entries(diff).map(([k, v]) => {
        if (v.length > 0) {
          return (
            <section>
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
                      <li className={style}>
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
    </div>
  );
}
