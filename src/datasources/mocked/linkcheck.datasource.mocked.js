import { restructureLinkStates } from "../linkcheck.datasource";

export async function load() {
  // response from catInspire service
  const response = {
    body: {
      linkStates: {
        "http://example.com/foo": {
          status: "GONE",
          lastCheckedAt: "2023-03-27T08:49:50+02:00",
          brokenSince: "2023-03-22T07:47:20+01:00",
        },
        "http://example.com": {
          status: "OK",
          lastCheckedAt: "2023-03-31T10:19:30+02:00",
        },
      },
    },
  };

  return restructureLinkStates(response.body?.linkStates);
}

export { teamLabel };
