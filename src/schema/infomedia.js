/**
 * @file article type definition and resolvers
 *
 */

export const typeDef = `
 type InfomediaContent{
     id: String!,
     headLine: String!,
     subHeadLine: String!,
     byLine: String!,
     dateLine: String!,
     paper: String!,
     text: String!,
     hedLine: String!,
     origin: String!,
     html: String!
 }`;

export const resolvers = {
  InfomediaContent: {
    id(parent, args, context, info) {
      return parent.id || "";
    },
    headLine(parent, args, context, info) {
      return parent.details.headLine || "";
    },
    subHeadLine(parent, args, context, info) {
      return parent.details.subHeadLine || "";
    },
    byLine(parent, args, context, info) {
      return parent.details.byLine || "";
    },
    dateLine(parent, args, context, info) {
      return parent.details.dateLine || "";
    },
    paper(parent, args, context, info) {
      return parent.details.paper || "";
    },
    hedLine(parent, args, context, info) {
      return parent.details.hedLine || "";
    },
    text(parent, args, context, info) {
      return parent.details.text || "";
    },
    origin(parent, args, context, info) {
      // We only have infomedia for now
      return "infomedia";
    },
    html(parent, args, context, info) {
      return parent.html || "";
    },
  },
};
