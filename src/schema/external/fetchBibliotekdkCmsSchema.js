//Fetches the latest bibliotekdkCms schema from the CMS and saves it to ./src/schema/external/bibliotekdkCmsSchema.json
//This script is used to update the schema when the CMS is updated.
//TODO: maybe run on build?

// To override the default CMS endpoint, run:
// BIBLIOTEKDK_CMS_URL=https://cms.bibliotek.dk/graphql node fetchBibliotekdkCmsSchema.js

const { writeFile } = require("node:fs/promises");
const path = require("node:path");
const graphql = require("graphql");

const { getIntrospectionQuery } = graphql;

const schemaPath = path.resolve(__dirname, "bibliotekdkCmsSchema.json");
const defaultUrl = "https://cms.bibliotek.dk/graphql";

async function fetchSchema(url) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: getIntrospectionQuery({ descriptions: true }),
    }),
  });

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Expected JSON from ${url}, got ${response.status} ${response.statusText}: ${text.slice(
        0,
        200
      )}`
    );
  }

  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((error) => error.message).join("; ") ||
      `${response.status} ${response.statusText}`;

    throw new Error(`Could not fetch GraphQL schema from ${url}: ${message}`);
  }

  if (!payload.data?.__schema) {
    throw new Error(`Response from ${url} did not include data.__schema`);
  }

  return payload;
}

async function main() {
  try {
    if (process.argv.length > 2) {
      throw new Error(
        "fetchBibliotekdkCmsSchema does not accept URL arguments. Set BIBLIOTEKDK_CMS_URL instead."
      );
    }

    const endpoint = process.env.BIBLIOTEKDK_CMS_URL || defaultUrl;
    const schema = await fetchSchema(endpoint);

    await writeFile(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);

    console.log(`Updated ${schemaPath}`);
    console.log(`Fetched schema from ${endpoint}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();