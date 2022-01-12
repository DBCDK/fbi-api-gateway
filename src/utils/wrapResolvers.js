const SYMBOL_PROCESSED = Symbol("processed");

/**
 * Wrap every resolver within a schema with some function
 * It is useful for timing resolvers, logging etc.
 *
 * Inspired by https://github.com/kiwicom/graphql-resolve-wrapper
 *
 * @param {*} schema
 * @param {func} wrapper
 */
export function wrapResolvers(schema, wrapper) {
  const types = schema.getTypeMap();
  // Traverse types in the schema
  Object.values(types).forEach((type) => {
    if (
      type[SYMBOL_PROCESSED] ||
      !type.getFields ||
      isSystemType(type.toString())
    ) {
      return;
    }

    // Traverse every field of the type
    Object.values(type.getFields()).forEach((field) => {
      // The original resolve function
      const resolveFn = field.resolve;

      if (field[SYMBOL_PROCESSED] || !resolveFn) {
        return;
      }

      field[SYMBOL_PROCESSED] = true;

      // Wrap the resolve function
      field.resolve = wrapper(resolveFn, field);
    });
  });
}

function isSystemType(fieldName) {
  // __TypeKind, __InputValue, ...
  return /^__/.test(fieldName);
}
