import qs from "querystring";

import { Accounts } from "@/components/Accounts";
import Section from "@/components/Section";
import useAccessToken from "@/hooks/useAccessToken";
import useTestUser from "@/hooks/useTestUser";
import { setConfig } from "@/config";
import { useRouter } from "next/router";

import globalConfig from "../../../src/config";

export default function TestUserLogin({ config }) {
  setConfig(config);
  const router = useRouter();
  const { seed, setSeed, params } = useAccessToken();

  const { user, testUserToken, loginAgencyName, loginAccount } = useTestUser();
  if (!config.validRedirect) {
    return <div>Der er noget galt med den der redirect_uri.</div>;
  }

  return (
    <>
      <Section bgColor="white">
        <h1>Testbruger login</h1>
        <div>
          Du simulerer login via <strong>{loginAgencyName || "..."}</strong>{" "}
          {user?.name && (
            <>
              med brugeren <strong>{user.name}</strong>
            </>
          )}
        </div>
        <form
          method="post"
          onSubmit={(e) => {
            // Prevent default form behaviour
            e.preventDefault();

            // We encode the test user token in the 'code'. This is not a security concern
            // since this token will never give access to any real user information.
            const code = btoa(testUserToken);

            // redirect to some next-auth callback
            location.href = `${router.query.redirect_uri}?code=${code}&state=${router.query.state}`;
          }}
        >
          <p>
            Brugeren dannes ud fra et Test ID du vælger. Benyt evt. dine
            DBC-initialer, for at få udleveret din helt egen testbruger.
          </p>
          <label>
            <div>Test ID</div>
            <input
              name="seed"
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              autoFocus
            />
          </label>
          {[
            { key: "uniqueId", value: loginAccount?.uniqueId || "" },
            { key: "accessToken", value: testUserToken || "" },
          ].map(({ key, value }) => (
            <label key={key}>
              <div>{key}</div>
              <input
                className="disable"
                readOnly
                name={key}
                type="text"
                value={value}
              />
            </label>
          ))}

          <button type="submit">Log ind</button>
        </form>
      </Section>
      <Section bgColor="#f4efdd">
        <Accounts />
      </Section>
      <Section bgColor="white">
        <h2>Loginparametre</h2>
        <p>Disse parametre bliver sendt med fra ...</p>
        {["callbackUrl", "force_login", "idp", "agency"].map((name) => (
          <label key={name}>
            <div>{name}</div>
            <input
              className="disable"
              readOnly
              name={name}
              type="text"
              value={router.query[name] || ""}
            />
          </label>
        ))}
      </Section>
      <Section bgColor="#050505" color="#e1e1e1">
        <h2>Hvad er det?</h2>
        <p>
          Dette login-system giver dig mulighed for at simulere oprettelsen af
          brugerkonti hos lokale bibliotekssystemer på en hurtig og nem måde.
          Det er vigtigt at bemærke, at disse konti ikke oprettes på de faktiske
          lokale systemer, men derimod i et sikkert testmiljø, som er tilsluttet
          til FBI-API.
        </p>
        <p>
          Systemet er særligt anvendeligt i scenarier, hvor vores Cicero
          testbrugere kommer til kort:
        </p>
        <ul>
          <li>bruger med konti på flere lokale biblioteker.</li>
          <li>
            sammenkobling af FFU biblioteker med folkebiblioteker (i CULR)
          </li>
          <li>login med MitID (her har vi ikke en testbruger)</li>
          <li>
            særlige indstillinger på lokale systemer (fx blokering af bruger)
          </li>
          <li>genskabe problemer, hvor Cicero-testbrugerne ikke slår til</li>
        </ul>
        <p>
          Systemet virker ved at testbrugeren bliver logget ind med en særlig
          test-token. FBI-API genkender denne token, og sørger for at levere
          mock-data for udvalgte services, der er relateret til brugerkonti
          (CULR, borchk, userinfo, lokale systemer).
        </p>
      </Section>
    </>
  );
}

/**
 * Taken from hejmdal
 */
function validateRedirectUri(redirect_uri, client) {
  const res =
    client.redirectUris.filter((uri) => {
      const req = new RegExp(
        `^${uri.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`,
        "g"
      );
      return redirect_uri.match(req);
    }).length > 0;

  return res;
}

/**
 * The usual anon token fetching
 */
async function fetchAnonToken(loginBibUrl, clientId) {
  const res = await fetch(`${loginBibUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=password&username=@&password=@&client_id=${encodeURIComponent(
      clientId
    )}&client_secret=@`,
  });
  return await res.json();
}

export async function getServerSideProps({ query }) {
  // Fetch anonymous token. we use this later to generate the test user token
  const loginBibUrl = new URL(globalConfig.datasources.userInfo.url).origin;

  // clientId is either a query param, or if dev mode it may be an environment variable
  const clientId =
    query.client_id ||
    (process.env.NODE_ENV === "development" && process.env.NEXT_DEV_CLIENT_ID);

  // fetch token
  const anonymousToken = await fetchAnonToken(loginBibUrl, clientId);

  // We need the smaug config in order to validate redirect_uri
  const smaugConfig = await fetch(
    `${globalConfig.datasources.smaug.url}/configuration?token=${anonymousToken.access_token}`,
    {
      method: "GET",
    }
  );
  const smaugConfigJson = await smaugConfig.json();

  return {
    props: {
      config: {
        anonymousToken,
        validRedirect: query.redirect_uri
          ? validateRedirectUri(query.redirect_uri, smaugConfigJson)
          : true,
      },
    },
  };
}
