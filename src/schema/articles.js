/**
 * @file article type definition and resolvers
 *
 */

export const typeDef = `
 type InfomediaArticleContent{
     id: String!,
     html: String!
 }`;

export const resolvers = {
  InfomediaArticleContent: {
    id(parent, args, context, info) {
      return parent.id;
    },
    html(parent, args, context, info) {
      return parent.html;
    },
  },
};
