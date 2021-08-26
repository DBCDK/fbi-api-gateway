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
     logo: String!,
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
    logo(parent, args, context, info) {
      const html = parent.details.logo;

      if (html) {
        const p_regex = /<p>(.*?)<\/p>/g;
        const p = html && html.match(p_regex)[0];

        // Strip div tags from content
        const strip_regex = /<[\/]{0,1}(p)[^><]*>/g;
        const content = p.replace(strip_regex, "");

        return content;
      }

      return "";
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
