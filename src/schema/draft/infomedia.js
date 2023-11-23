import { getInfomediaAgencyId } from "../../utils/access";

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
enum InfomediaError {
  ${errors}
}
enum AccessStatus {
  OK
  USER_NOT_LOGGED_IN
  MUNICIPALITY_NOT_SUBSCRIBED
}
type InfomediaResponse {

  """
  Infomedia error
  """
  error: InfomediaError

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

async function fetchArticle(parent, context) {
  const articleId = parent?.id;
  const userId = context?.user?.userId;

  // users access given agencyId
  const agencyId = await getInfomediaAgencyId(context);

  const article = await context.datasources.getLoader("infomedia").load({
    articleId,
    userId,
    agencyId,
  });

  return article;
}

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
    async hedLine(parent) {
      return parent.hedline;
    },
  },
};
