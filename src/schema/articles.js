/**
 * @file article type definition and resolvers
 *
 */

export const typeDef = `
 type HtmlContent{
     id: String!,
     origin: String!,
     html: String!
 }`;

export const resolvers = {
  HtmlContent: {
    id(parent, args, context, info) {
      return parent.id;
    },
    origin(parent, args, context, info) {
      // We only have infomedia for now
      return "infomedia";
    },
    html(parent, args, context, info) {
      return parent.html;
    },
  },
};
