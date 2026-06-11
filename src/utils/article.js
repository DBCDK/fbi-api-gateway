import { getInfomediaAgencyId } from "./access";

export async function fetchArticle(parent, context) {
  const id = parent?.id;

  if (!id) {
    return null;
  }

  const retrieverArticle = await context.datasources
    .getLoader("retriever")
    .load({ docId: id });

    // console.log("retrieverArticle",retrieverArticle);
  if (retrieverArticle) {
    return retrieverArticle;
  }

  const agencyId = await getInfomediaAgencyId(context);

  if (!agencyId) {
    return null;
  }

  return await context.datasources.getLoader("infomedia").load({
    articleId: id,
    agencyId,
  });
}
