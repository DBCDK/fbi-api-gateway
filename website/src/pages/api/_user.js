import fetch from "isomorphic-unfetch";
import { buildGraphQLPath } from "@/utils/graphqlPath";

const query = `
query User_Details {
  user {
    name
    mail
    municipalityAgencyId
    loggedInAgencyId
    isCPRValidated
    identityProviderUsed
    agencies {
      hitcount
      borrowerStatus{
        allowed
        statusCode
      }
      result {
        name
        branchId
        userIsBlocked
        agencyId
        agencyName
      }
    }
  }
}`;

async function graphQL({ token, agency, profile }) {
  const path = buildGraphQLPath({
    agency,
    defaultAgency: null,
    alwaysRequireAgencyId: false,
    profile,
  });

  return await fetch(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables: {} }),
  });
}

/**
 * Handle smaug endpoint req and res
 */
export default async function handler(req, res) {
  const { token, agency, profile } = req.query;

  if (!token || !profile) {
    // Missing params -> throw bad request
    return res.status(400).send({});
  }

  const response = await graphQL({ token, agency, profile });
  const parsed = await response.json();

  if (parsed.errors?.length > 0) {
    // Errors found -> throw bad request
    return res.status(400).send(parsed);
  }

  return res.status(response.status).send(parsed);
}
