const errors = [
  "SERVICE_NOT_LICENSED",
  "SERVICE_UNAVAILABLE",
  "LIBRARY_NOT_FOUND",
  "ERROR_IN_REQUEST",
  "BORROWER_NOT_LOGGED_IN",
  "BORROWER_NOT_FOUND",
  "BORROWERCHECK_NOT_ALLOWED",
  "BORROWER_NOT_IN_MUNICIPALITY",
  "NO_MUNICIPALITY",
];
export const typeDef = `
enum InfomediaError {
  SERVICE_NOT_LICENSED
  SERVICE_UNAVAILABLE
  LIBRARY_NOT_FOUND
  ERROR_IN_REQUEST
  BORROWER_NOT_LOGGED_IN
  BORROWER_NOT_FOUND
  BORROWERCHECK_NOT_ALLOWED
  INTERNAL_SERVER_ERROR
  BORROWER_NOT_IN_MUNICIPALITY
  NO_MUNICIPALITY  
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
  const userId = context.smaug?.user?.id;
  const municipalityAgencyId = (
    await context.datasources.getLoader("userinfo").load({
      accessToken: context.accessToken,
    })
  )?.attributes?.municipalityAgencyId;

  const article = await context.datasources.getLoader("infomedia").load({
    articleId,
    userId,
    municipalityAgencyId,
  });

  return article;
}

export const resolvers = {
  InfomediaResponse: {
    async error(parent, args, context, info) {
      if (!context?.smaug?.user?.id) {
        return "BORROWER_NOT_LOGGED_IN";
      }
      const article = await fetchArticle(parent, context);
      if (article.error) {
        if (!errors.includes(article.error)) {
          return "INTERNAL_SERVER_ERROR";
        }
        return article.error;
      }
    },
    async article(parent, args, context, info) {
      if (!context?.smaug?.user?.id) {
        return null;
      }
      const article = await fetchArticle(parent, context);
      if (article.error) {
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
