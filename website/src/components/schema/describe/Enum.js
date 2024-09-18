import useSchema from "@/hooks/useSchema";
import useStorage from "@/hooks/useStorage";
import { orderBy } from "lodash";
import { useMemo } from "react";

/*
 * A React component that lists possible values of a Enum type
 */
export default function DescribeEnum({ name }) {
  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);
  const enumValues = useMemo(() => {
    const type = schema?.getTypeMap()?.[name];
    const values = type?.getValues();
    return orderBy(values, "name", "asc");
  }, [schema]);

  if (schema && !enumValues?.length) {
    return (
      <p>
        <strong>
          Unknown enum <em>{name}</em>
        </strong>
      </p>
    );
  }

  return (
    <ul>
      {enumValues?.map((entry) => {
        return (
          <li key={entry.name}>
            <p>
              <em>
                <strong>{entry.name}</strong>
              </em>{" "}
              {entry.description && `- ${entry.description}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
