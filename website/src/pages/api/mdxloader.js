import remarkEmoji from "remark-emoji";
import { serialize } from "next-mdx-remote/serialize";
import fs from "fs";
import path from "path";
const dirRelativeToPublicFolder = "docs";
const dir = path.resolve("./src", dirRelativeToPublicFolder);

let docs;

async function initDocs() {
  // If docs are already loaded and we are in prod,
  // we return previously loaded docs.
  // in development we support hot reloading
  if (docs && process.env.NODE_ENV === "production") {
    return docs;
  }

  docs = await Promise.all(
    fs
      .readdirSync(dir)
      .filter((filename) => filename.endsWith(".mdx"))
      .map(async (filename) => ({
        name: filename.replace(".mdx", ""),
        mdxSource: await serialize(
          fs.readFileSync(path.resolve(dir, filename)).toString(),
          {
            // made available to the arguments of any custom mdx component
            scope: {},
            // MDX's available options at time of writing pulled directly from
            // https://github.com/mdx-js/mdx/blob/master/packages/mdx/index.js
            mdxOptions: {
              remarkPlugins: [remarkEmoji],
            },
            // Indicates whether or not to parse the frontmatter from the mdx source
            parseFrontmatter: false,
          }
        ),
      }))
  );

  return docs;
}
/**
 * Dynamically loads documentation based on access token
 *
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  const documents = await initDocs();
  res.status(200).json({ docs: documents });
}
