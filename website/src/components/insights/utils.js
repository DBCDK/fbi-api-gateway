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

function getSchemaFlags(item) {
  const isDraft = item?.deprecationReason === "@draft";
  return {
    isDraft,
    isDeprecated: Boolean(item?.isDeprecated && !isDraft),
  };
}

// combines the the type/field to a changelog obj structure
function selectFields(type, field) {
  const split = field?.deprecationReason?.split("expires:");
  const expires = split?.[1]?.trim() || null;
  const deprecationReason = split?.[0]?.trim() || null;

  return {
    type: {
      name: type?.name,
      kind: type?.kind,
      description: type?.description,
    },
    field: {
      name: field?.name,
      type: field?.type,
      description: field?.description,
      expires,
      args: field.args?.map((arg) => selectArgFields(arg)),
      isDeprecated: field?.isDeprecated,
      deprecationReason,
    },
  };
}

export function getFields(json) {
  const arr = [];

  if (!json?.data) {
    return arr;
  }

  const types = json.data.__schema?.types;
  types?.forEach((obj) => {
    const target = getKind(obj);
    const ignore = obj.name.startsWith("__");

    if (target) {
      const hits = [];
      obj?.[target]?.forEach((field) => {
        hits.push(field);
      });

      if (hits.length) {
        hits.forEach((hit) => !ignore && arr.push(selectFields(obj, hit)));
      }
    }
  });

  return arr;
}

export function buildTemplates(data) {
  if (!data || !data.length) {
    return [];
  }

  return data
    .filter(({ type }) => ["OBJECT", "INTERFACE"].includes(type.kind))
    .map(({ type, field }) => {
      const schemaFlags = getSchemaFlags(field);
      return {
        path: `${type.name}.${field.name}`,
        kind: type.kind,
        type: type.name,
        field: field.name,
        arguments: field.args,
        ...schemaFlags,
        description: field.description,
        reason: field.deprecationReason,
        expires: field.expires,
      };
    });
}

export function buildArgumentTemplates(data) {
  if (!data?.length) return [];

  return data
    .filter(({ type }) => ["OBJECT", "INTERFACE"].includes(type.kind))
    .flatMap(({ type, field }) =>
      (field.args || []).map((argument) => {
        const schemaFlags = getSchemaFlags(argument);
        return {
          path: `${type.name}.${field.name}.${argument.name}`,
          kind: "ARGUMENT",
          type: `${type.name}.${field.name}`,
          field: argument.name,
          ...schemaFlags,
          reason: argument.deprecationReason,
          expires: argument.expires,
        };
      })
    );
}

export function buildInputFieldTemplates(data) {
  if (!data?.length) return [];

  return data
    .filter(({ type }) => type.kind === "INPUT_OBJECT")
    .map(({ type, field }) => {
      const schemaFlags = getSchemaFlags(field);
      return {
        path: `${type.name}.${field.name}`,
        kind: "INPUT_FIELD",
        type: type.name,
        field: field.name,
        ...schemaFlags,
        description: field.description,
        reason: field.deprecationReason,
        expires: field.expires,
      };
    });
}
