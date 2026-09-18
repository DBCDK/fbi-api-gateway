export async function fetchArticle(parent, context) {
  const id = parent?.id;

  if (!id) {
    return null;
  }

  return await context.datasources
    .getLoader("retriever")
    .load({ docId: id });
}
