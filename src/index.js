import express from "express";
import axios from "axios";
import qs from "qs";
import session from "cookie-session";
import dotenv from "dotenv";
import { DaprClient, CommunicationProtocolEnum } from "@dapr/dapr";

dotenv.config();

const app = express();

// Basic app config
const APP_PORT = parseInt(process.env.PORT || "3000", 10);
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || "3500";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret-change";

// Keycloak config via env
// Prefer issuer URL like: https://<host>/realms/<realm>
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER; // required
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID; // required
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${APP_PORT}/oauth/callback`;
const SCOPES = process.env.SCOPES || "openid profile email";

if (!KEYCLOAK_ISSUER || !KEYCLOAK_CLIENT_ID) {
  console.error("Missing required env: KEYCLOAK_ISSUER and KEYCLOAK_CLIENT_ID");
  process.exit(1);
}

// Derived OIDC endpoints
const AUTH_URL = `${KEYCLOAK_ISSUER}/protocol/openid-connect/auth`;
const TOKEN_URL = `${KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
const USERINFO_URL = `${KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`;
const LOGOUT_URL = `${KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;

// Fetch client secret from Dapr local file secret store
const daprClient = new DaprClient("127.0.0.1", DAPR_HTTP_PORT, CommunicationProtocolEnum.HTTP);
let keycloakClientSecret = null;

async function loadKeycloakClientSecret() {
  try {
    const secretMap = await daprClient.secret.get("local-secretstore", "KEYCLOAK_CLIENT_SECRET");
    keycloakClientSecret = secretMap?.KEYCLOAK_CLIENT_SECRET;
    if (!keycloakClientSecret) {
      throw new Error("KEYCLOAK_CLIENT_SECRET not present in secret store");
    }
    console.log("Fetched KEYCLOAK_CLIENT_SECRET via Dapr secret store.");
  } catch (err) {
    console.error("Failed to load Keycloak client secret from Dapr:", err.message);
    process.exit(1);
  }
}

// Minimal cookie session for demo
app.use(
  session({
    name: "sid",
    secret: SESSION_SECRET,
    httpOnly: true,
    sameSite: "lax",
  })
);

// Home page
app.get("/", (req, res) => {
  const isAuthed = Boolean(req.session?.access_token);
  res.type("html").send(`
    <h1>Dapr + Keycloak (Auth Code)</h1>
    <p>Status: ${isAuthed ? "Authenticated" : "Anonymous"}</p>
    <ul>
      <li><a href="/login">Login</a></li>
      <li><a href="/protected">Call protected API</a></li>
      <li><a href="/logout">Logout</a></li>
    </ul>
  `);
});

// Start OIDC auth code flow
app.get("/login", (req, res) => {
  const state = Math.random().toString(36).slice(2);
  req.session.state = state;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
  });
  const redirect = `${AUTH_URL}?${params.toString()}`;
  res.redirect(302, redirect);
});

// OAuth2 redirect URI handler
app.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || state !== req.session.state) {
    return res.status(400).send("Invalid OAuth callback");
  }
  try {
    // Exchange code for tokens
    const body = qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: KEYCLOAK_CLIENT_ID,
      client_secret: keycloakClientSecret,
    });
    const tokenResp = await axios.post(TOKEN_URL, body, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    // Store tokens in session (demo only)
    req.session.access_token = tokenResp.data.access_token;
    req.session.refresh_token = tokenResp.data.refresh_token;
    res.redirect("/");
  } catch (err) {
    console.error("Token exchange failed:", err.response?.data || err.message);
    res.status(500).send("Token exchange failed");
  }
});

// Example protected resource
app.get("/protected", async (req, res) => {
  const accessToken = req.session?.access_token;
  if (!accessToken) return res.status(401).send("Unauthorized");
  try {
    const me = await axios.get(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    res.json({ ok: true, userinfo: me.data });
  } catch (err) {
    console.error("Userinfo call failed:", err.response?.data || err.message);
    res.status(401).send("Access token invalid or expired");
  }
});

// Logout (end session)
app.get("/logout", async (req, res) => {
  const refreshToken = req.session?.refresh_token;
  req.session = null;
  if (!refreshToken) return res.redirect("/");
  try {
    const body = qs.stringify({
      client_id: KEYCLOAK_CLIENT_ID,
      client_secret: keycloakClientSecret,
      refresh_token: refreshToken,
    });
    await axios.post(LOGOUT_URL, body, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
  } catch (err) {
    // Non-fatal for demo
    console.warn("Logout request failed:", err.response?.data || err.message);
  }
  res.redirect("/");
});

// Bootstrap
(async () => {
  await loadKeycloakClientSecret();
  app.listen(APP_PORT, () => {
    console.log(`App listening on http://localhost:${APP_PORT}`);
    console.log("Ensure you run this with Dapr sidecar, e.g.:");
    console.log(
      `dapr run --app-id keycloak-demo --app-port ${APP_PORT} --dapr-http-port ${DAPR_HTTP_PORT} --components-path ./components -- node src/index.js`
    );
  });
})();

