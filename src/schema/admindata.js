import { get } from "lodash";

export const typeDef = `
type AdminData {
  creationDate: String
}`;

export const resolvers = {
  AdminData: {
    async creationDate(parent, args, context, info) {
      const manifestation = await context.datasources.openformat.load(
        parent.pid
      );
      return get(manifestation, "admindata.creationDate.$", "unknown");
    },
  },
};
