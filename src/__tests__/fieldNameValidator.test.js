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

function InputObjectTypeDefinition(name, isDeprecated = false) {
  return {
    kind: "InputObjectTypeDefinition",
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

function InterfaceTypeDefinition(name, isDeprecated) {
  return {
    kind: "InterfaceTypeDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    directives: [isDeprecated && DEPRECATED],
  };
}

function UnionTypeDefinition(name, isDeprecated) {
  return {
    kind: "UnionTypeDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    directives: [isDeprecated && DEPRECATED],
  };
}

function EnumTypeDefinition(name, fields = []) {
  return {
    kind: "EnumTypeDefinition",
    name: {
      kind: "Name",
      value: name,
    },
    directives: [],
    fields: fields.map((obj) => ({
      kind: "EnumValueDefinition",
      name: {
        kind: "Name",
        value: obj.name,
      },
      arguments: [],
      directives: [obj.isDeprecated && DEPRECATED],
    })),
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
  test("sholud throw 'PascalCase error'", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [ObjectTypeDefinition("someLowerCasedTypeName")],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "Type 'someLowerCasedTypeName' (ObjectTypeDefinition) is a TypeDefinition and should be written in PascalCase"
    );
  });

  test("sholud throw error for field names matching type name", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [
          ObjectTypeDefinition("SomeTypeName", [
            { name: "someFieldNAME", isDeprecated: false },
            { name: "someFieldName", isDeprecated: false },
          ]),
        ],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "Field name 'someFieldName' in 'SomeTypeName' is already used"
    );
  });

  test("sholud IGNORE errors for deprecated fields", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [
          ObjectTypeDefinition("SomeOtherTypeName", [
            { name: "someFieldNAME", isDeprecated: true }, // <---- note the deprecated flag
            { name: "someFieldName", isDeprecated: false },
          ]),
        ],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).not.toThrow(Error);
  });

  test("sholud throw if Enum is NOT written all UPPERCASE", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [
          EnumTypeDefinition("LowerCasedValuesEnum", [
            { name: "VALID_ENUM", isDeprecated: false },
            { name: "not_valid_enum", isDeprecated: false },
          ]),
        ],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "Field 'not_valid_enum' in type 'LowerCasedValuesEnum' (EnumValueDefinition) is an enum and should be written all UPPERCASE"
    );
  });

  test("sholud throw IF Enum missing 'tailed type error'", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [EnumTypeDefinition("SomeEnumWithoutTypedTailing")],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "'SomeEnumWithoutTypedTailing' is a EnumTypeDefinition which should always end with 'Enum'"
    );
  });

  test("sholud throw Input missing 'tailed type error'", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [
          InputObjectTypeDefinition("SomeInputWithoutTypedTailing"),
        ],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "'SomeInputWithoutTypedTailing' is a InputObjectTypeDefinition which should always end with 'Input'"
    );
  });

  test("sholud throw Scalar missing 'tailed type error'", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [ScalarTypeDefinition("SomeScalarWithoutTypedTailing")],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "'SomeScalarWithoutTypedTailing' is a ScalarTypeDefinition which should always end with 'Scalar'"
    );
  });

  test("sholud throw Interface missing 'tailed type error'", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [
          InterfaceTypeDefinition("SomeInterfaceWithoutTypedTailing"),
        ],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "'SomeInterfaceWithoutTypedTailing' is a InterfaceTypeDefinition which should always end with 'Interface'"
    );
  });

  test("sholud throw Union missing 'tailed type error'", async () => {
    const SCHEMA = {
      typeDefs: {
        definitions: [UnionTypeDefinition("SomeUnionWithoutTypedTailing")],
      },
    };

    const test = () => fieldNameValidator(SCHEMA, "THROW");

    expect(test).toThrow(Error);
    expect(test).toThrow(
      "'SomeUnionWithoutTypedTailing' is a UnionTypeDefinition which should always end with 'Union'"
    );
  });
});
