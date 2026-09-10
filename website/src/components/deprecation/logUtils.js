import {
  getDraftDetails,
  isDraftDeprecated,
  isTrueDeprecated,
} from "@fbi-api/utils/deprecation";

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

function splitDeprecationReason(reason) {
  const split = reason?.split("expires:");
  const expires = split?.[1]?.trim() || null;
  const deprecationReason = split?.[0]?.trim() || null;

  return {
    expires,
    deprecationReason,
    draftDetails: getDraftDetails(deprecationReason),
  };
}

function selectArgFields(arg) {
  if (!arg) {
    return [];
  }

  const { expires, deprecationReason, draftDetails } = splitDeprecationReason(
    arg?.deprecationReason
  );

  return {
    name: arg?.name,
    type: arg?.type,
    expires,
    isDeprecated: arg?.isDeprecated,
    deprecationReason,
    draftDetails,
  };
}

function selectFields(type, field) {
  const { expires, deprecationReason, draftDetails } = splitDeprecationReason(
    field?.deprecationReason
  );

  return {
    type: { name: type?.name, kind: type?.kind },
    field: {
      name: field?.name,
      type: field?.type,
      expires,
      args: field.args
        ?.filter((arg) => arg.isDeprecated)
        .map((arg) => selectArgFields(arg)),
      isDeprecated: field?.isDeprecated,
      deprecationReason,
      draftDetails,
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

export function getChangelogEntries(json) {
  return getDeprecatedFields(json)
    .flatMap(({ type, field }) => {
      const base = {
        kind: type.kind,
        type: type.name,
        field: field.name,
      };

      if (isTrueDeprecated(field)) {
        return [
          {
            ...base,
            reason: field.deprecationReason,
            expires: field.expires,
          },
        ];
      }

      return (
        field.args
          ?.filter((arg) => isTrueDeprecated(arg))
          .map((arg) => ({
            ...base,
            argument: arg.name,
            reason: arg.deprecationReason,
            expires: arg.expires,
          })) || []
      );
    })
    .filter(Boolean);
}

export function getDraftLogEntries(json) {
  return getDeprecatedFields(json)
    .flatMap(({ type, field }) => {
      const base = {
        kind: type.kind,
        type: type.name,
        field: field.name,
      };

      if (isDraftDeprecated(field)) {
        return [
          {
            ...base,
            details: field.draftDetails,
          },
        ];
      }

      return (
        field.args
          ?.filter((arg) => isDraftDeprecated(arg))
          .map((arg) => ({
            ...base,
            argument: arg.name,
            details: arg.draftDetails,
          })) || []
      );
    })
    .filter(Boolean);
}
