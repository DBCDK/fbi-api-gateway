import { getInfomediaAccessStatus } from "../../utils/utils";

export const typeDef = `
enum Draft_AccessStatus {
  OK
  USER_NOT_LOGGED_IN
  MUNICIPALITY_NOT_SUBSCRIBED
}
type Draft_InfomediaResponse {

  """
  Can the current user obtain the article?
  """
  accessStatus: Draft_AccessStatus!

  article: Draft_InfomediaArticle
}
type Draft_InfomediaArticle {
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
  Draft_InfomediaResponse: {
    accessStatus(parent, args, context, info) {
      return getInfomediaAccessStatus(context);
    },
    async article(parent, args, context, info) {
      const accessStatus = await getInfomediaAccessStatus(context);
      if (accessStatus !== "OK") {
        return null;
      }
      const articleId = parent?.id;
      const userId = context.smaug?.user?.id;
      const municipalityAgencyId = (
        await context.datasources.userinfo.load({
          accessToken: context.accessToken,
        })
      )?.attributes?.municipalityAgencyId;

      const article = await context.datasources.infomedia.load({
        articleId,
        userId,
        municipalityAgencyId,
      });
      return article;
    },
  },
};
