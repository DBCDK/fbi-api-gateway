import qs from "querystring";

import { Accounts } from "@/components/Accounts";
import Section from "@/components/Section";
import useAccessToken from "@/hooks/useAccessToken";
import useTestUser from "@/hooks/useTestUser";
import config, { setConfig } from "@/config";

export default function TestUserLogin({ config }) {
  setConfig(config);
  const { seed, setSeed, params, csrfToken } = useAccessToken();

  const { user, testUserToken, loginAgencyName, loginAccount } = useTestUser();

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
        <form method="post" action={config.callbackUrl}>
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
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
              value={params?.get(name) || ""}
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

async function getBody({ req }) {
  return new Promise((resolve) => {
    let postBody = "";
    req.on("data", (data) => {
      postBody += data.toString();
    });
    req.on("end", () => {
      resolve(postBody && qs.parse(postBody));
    });
  });
}

function getCookies(context) {
  return Object.fromEntries(
    context.req.headers?.cookie
      .split("; ")
      .map((v) => v.split(/=(.*)/s).map(decodeURIComponent))
  );
}
export async function getServerSideProps(context) {
  // This may be an incoming POST request, lets check the body
  const config = await getBody(context);
  if (config) {
    // Store body in a cookie, so we can get it if user refreshes browser window
    context.res.setHeader(
      "Set-Cookie",
      `testusercontext=${JSON.stringify(config)}; Path=/; SameSite=Lax`
    );
    return { props: { config } };
  }

  // Check if config is in cookies
  const cookies = getCookies(context);
  const configFromCookie =
    cookies?.testusercontext && JSON.parse(cookies.testusercontext);

  if (configFromCookie) {
    return { props: { config: configFromCookie } };
  }

  // If config is not in a cookie, but we are in dev mode
  if (process.env.NODE_ENV === "development") {
    return {
      props: {
        config: {
          accessToken: process.env.NEXT_PUBLIC_DEV_ACCESS_TOKEN,
          fbiApiUrl: process.env.NEXT_PUBLIC_DEV_FBI_API_URL,
        },
      },
    };
  }

  // bummer
  return { props: { config: {} } };
}
