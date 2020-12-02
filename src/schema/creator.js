/**
 * @file Creator type definition and resolvers
 *
 */
import { get } from "lodash";

export const typeDef = `
type Creator {
  functionCode: String!
  functionSingular: String!
  functionPlural: String! 
  name: String!
  type: String!
  description: String!
  imageUrl: String
}`;

export const resolvers = {
  Creator: {
    functionCode(parent) {
      return get(parent, "functionCode.$", "");
    },
    functionSingular(parent) {
      return get(parent, "functionSingular.$", "");
    },
    functionPlural(parent) {
      return get(parent, "functionPlural.$", "");
    },
    name(parent) {
      if (parent.value) {
        return parent.value;
      }
      return get(parent, "name.$", "");
    },
    type(parent) {
      return parent.type || get(parent, "functionCode.$", "");
    },
    async description(parent, args, context, info) {
      const name = parent.value || get(parent, "name.$", "");
      const creator = await context.datasources.creator.load(name);
      return get(creator, "description", "");
    },
    async imageUrl(parent, args, context, info) {
      const name = parent.value || get(parent, "name.$", "");
      const creator = await context.datasources.creator.load(name);
      return get(creator, "image.url");
    }
  }
};
