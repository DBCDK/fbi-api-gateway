// fieldNameValidator

import { fieldNameValidator } from "../schemaLoader";

function ObjectTypeDefinition(name, fields = []) {
  return {
    kind: "ObjectTypeDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    interfaces: [],
    directives: [],
    fields: fields.map((obj) => ({
      kind: "FieldDefinition",
      name: {
        kind: "Name",
        value: obj.name,
      },
      arguments: [],
      directives: [obj.isDeprecated && DEPRECATED],
    })),
  };
}

function InputValueDefinition(name, isDeprecated = false) {
  return {
    kind: "InputValueDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    directives: [isDeprecated && DEPRECATED],
  };
}

function ScalarTypeDefinition(name, isDeprecated) {
  return {
    kind: "ScalarTypeDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    directives: [isDeprecated && DEPRECATED],
  };
}

function EnumValueDefinition(name, isDeprecated) {
  return {
    kind: "EnumValueDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    directives: [isDeprecated && DEPRECATED],
  };
}

const DEPRECATED = {
  kind: "Directive",
  name: {
    kind: "Name",
    value: "deprecated",
  },
  arguments: [],
};

describe("fieldNameValidator error message testing", () => {
  test.only("sholud throw error 'something something...'", async () => {
    const SCHEMA = {
      typeDefs: { definitions: [ObjectTypeDefinition("ost")] },
    };

    const result = fieldNameValidator(SCHEMA);

    expect(result).toMatchSnapshot();
  });
});
