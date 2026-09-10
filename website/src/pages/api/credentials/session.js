import { clearCredentialSession } from "../../../lib/credentialSession";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).send({});
  }

  await clearCredentialSession({ req, res });

  return res.status(200).send({
    status: "OK",
  });
}
