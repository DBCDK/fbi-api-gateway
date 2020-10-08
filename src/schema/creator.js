/**
 * @file Creator type definition and resolvers
 *
 */
import { get } from "lodash";

export const typeDef = `
type Creator {
  functionCode: String! @deprecated(reason: "Field is deprecated!")
  functionSingular: String! @deprecated(reason: "Field is deprecated!")
  functionPlural: String! @deprecated(reason: "Field is deprecated!")
  name: String!
  searchQuery: SearchQuery! @deprecated(reason: "Field is deprecated!")
  type: String!
}`;

export const resolvers = {
  Creator: {
    functionCode(parent) {
      return get(parent, "functionCode.$", "unknown");
    },
    functionSingular(parent) {
      return get(parent, "functionSingular.$", "unknown");
    },
    functionPlural(parent) {
      return get(parent, "functionPlural.$", "unknown");
    },
    name(parent) {
      if (parent.value) {
        return parent.value;
      }
      return get(parent, "name.$", "unknown");
    },
    searchQuery(parent) {
      return { ...parent, value: parent.name };
    }
  }
};
