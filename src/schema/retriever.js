import { fetchArticle } from "../utils/article";

const errors = [
  "SERVICE_NOT_LICENSED",
  "SERVICE_UNAVAILABLE",
  "LIBRARY_NOT_FOUND",
  "ARTICLE_NOT_FOUND",
  "BORROWER_NOT_LOGGED_IN",
  "BORROWER_NOT_FOUND",
  "BORROWERCHECK_NOT_ALLOWED",
  "INTERNAL_SERVER_ERROR",
  "BORROWER_NOT_IN_MUNICIPALITY",
  "NO_AGENCYID",
];

export const typeDef = `
"""
Error codes returned when an article cannot be fetched or the user is not allowed to access it.
"""
enum RetrieverErrorEnum {
  ${errors}
}

"""
Response wrapper for a single article lookup.
"""
type RetrieverResponse {
  """
  Present when the article could not be fetched or the user is not allowed to access it.
  When this field is set, \`article\` will be null.
  """
  error: RetrieverErrorEnum

  """
  The requested article, when available.
  Returns null if \`error\` is set or the article was not found.
  """
  article: RetrieverArticle
}

"""
A newspaper or media article.
"""
type RetrieverArticle {
  """
  Unique document identifier in Retriever (DOC_ID).
  Use this value for subsequent article lookups.
  """
  id: String!

  """
  Main headline of the article.
  """
  headline: String

  """
  Secondary headline or deck, when provided by the source.
  """
  subHeadline: String

  """
  Author or byline credited with the article.
  """
  byLine: String

  """
  Date and time when the article was published, in ISO 8601 format.
  """
  publishingDate: String

  """
  Type of media the article was published in, for example \`print\` or \`web\`.
  """
  mediaType: String

  """
  Page number or page range in the original publication.
  """
  pages: String

  """
  Category of the source publication, for example national news media.
  """
  sourceCategory: String

  """
  Country of the source publication, for example \`Denmark\`.
  """
  sourceCountry: String

  """
  Numeric identifier of the source publication in Retriever.
  """
  sourceId: Int

  """
  Name of the source publication, for example a newspaper title.
  """
  sourceName: String

  """
  Geographic region or regions covered by the source publication.
  """
  sourceRegion: String

  """
  Theme or subject category assigned to the article by Retriever.
  """
  themeCategory: String

  """
  URL to a thumbnail preview image of the article.
  """
  thumbnail: String

  """
  URL to open the article in Retriever.
  """
  url: String

  """
  Approximate number of words in the article body.
  """
  wordCount: Int

  """
  Full article text as plain text.
  """
  fullText: String

  """
  Full article text formatted with simple HTML tags.
  """
  fullTextHtml: String
}

extend type Query {
  """
  Fetch a single article from Retriever by its document id.

  Retriever is a media monitoring service that provides access to articles from newspapers
  and other news sources, including full text, publication metadata, and links to the original source.

  Requires an authenticated user with a valid subscription through their municipality of residence.
  Check \`error\` on the response for access or lookup failures.
  """
  retriever(
    """
    Retriever document id for the article to fetch.
    """
    id: String!
  ): RetrieverResponse!
}
`;

export const resolvers = {
  Query: {
    retriever(parent, args) {
      return args;
    },
  },
  RetrieverResponse: {
    async error(parent, args, context) {
      if (!context?.user?.userId) {
        return "BORROWER_NOT_LOGGED_IN";
      }

      const article = await fetchArticle(parent, context);

      if (!article) {
        return "ARTICLE_NOT_FOUND";
      }

      if (article.error) {
        if (!errors.includes(article.error)) {
          return "INTERNAL_SERVER_ERROR";
        }
        return article.error;
      }
    },
    async article(parent, args, context) {
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
  RetrieverArticle: {
    id(parent) {
      return parent.DOC_ID || parent.id;
    },
    headline(parent) {
      return parent.HEADLINE || parent.headLine;
    },
    subHeadline(parent) {
      return parent.SUBHEADLINE || parent.subHeadLine;
    },
    byLine(parent) {
      return parent.BYLINE || parent.byLine;
    },
    publishingDate(parent) {
      return parent.PUBLISHING_DATE || parent.dateLine;
    },
    sourceName(parent) {
      return parent.SOURCE_NAME || parent.paper;
    },
    fullText(parent) {
      return parent.FULLTEXT || parent.textNoHtml;
    },
    fullTextHtml(parent) {
      return parent.FULLTEXT_HTML || parent.html;
    },
    mediaType(parent) {
      return parent.MEDIATYPE;
    },
    pages(parent) {
      return parent.PAGES;
    },
    sourceCategory(parent) {
      return parent.SOURCE_CATEGORY;
    },
    sourceCountry(parent) {
      return parent.SOURCE_COUNTRY;
    },
    sourceId(parent) {
      return parent.SOURCE_ID;
    },
    sourceRegion(parent) {
      return parent.SOURCE_REGION;
    },
    themeCategory(parent) {
      return parent.THEME_CATEGORY;
    },
    thumbnail(parent) {
      return parent.THUMBNAIL;
    },
    url(parent) {
      return parent.URL;
    },
    wordCount(parent) {
      return parent.WORDCOUNT;
    },
  },
};
