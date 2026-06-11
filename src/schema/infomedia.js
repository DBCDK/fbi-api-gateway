import { fetchArticle } from "../utils/article";

const errors = [
  "SERVICE_NOT_LICENSED",
  "SERVICE_UNAVAILABLE",
  "LIBRARY_NOT_FOUND",
  "ERROR_IN_REQUEST",
  "BORROWER_NOT_LOGGED_IN",
  "BORROWER_NOT_FOUND",
  "BORROWERCHECK_NOT_ALLOWED",
  "INTERNAL_SERVER_ERROR",
  "BORROWER_NOT_IN_MUNICIPALITY",
  "NO_AGENCYID",
];

export const typeDef = `
enum InfomediaErrorEnum {
  ${errors}
}

type InfomediaResponse {

  """
  Infomedia error
  """
  error: InfomediaErrorEnum

  article: InfomediaArticle
}
type InfomediaArticle {
  id: String!
  headLine: String
  subHeadLine: String
  byLine: String
  dateLine: String
  paper: String
  text: String
  hedLine: String
  logo: String
  html: String
}
`;

export const resolvers = {
  InfomediaResponse: {
    async error(parent, args, context, info) {
      if (!context?.user?.userId) {
        return "BORROWER_NOT_LOGGED_IN";
      }
      const article = await fetchArticle(parent, context);
      // quickfix - there is no article - this is the best error message
      // i can find for now - TODO better error message
      if (!article) {
        return "ERROR_IN_REQUEST";
      }

      if (article.error) {
        if (!errors.includes(article.error)) {
          return "INTERNAL_SERVER_ERROR";
        }
        return article.error;
      }
    },
    async article(parent, args, context, info) {
      if (!context?.user?.userId) {
        return null;
      }
      const article = await fetchArticle(parent, context);
      if (!article || article.error) {
        return null;
      }
      return article;
    },
  },
  InfomediaArticle: {
    id(parent) {
      return parent.DOC_ID || parent.id;
    },
    headLine(parent) {
      return parent.HEADLINE || parent.headLine;
    },
    subHeadLine(parent) {
      return parent.SUBHEADLINE || parent.subHeadLine;
    },
    byLine(parent) {
      return parent.BYLINE || parent.byLine;
    },
    dateLine(parent) {
      return parent.PUBLISHING_DATE || parent.dateLine;
    },
    paper(parent) {
      return parent.SOURCE_NAME || parent.paper;
    },
    text(parent) {
      return parent.FULLTEXT || parent.text;
    },
    html(parent) {
      return parent.FULLTEXT_HTML || parent.html;
    },
    hedLine(parent) {
      return  parent.hedline;
    },
  },
};
