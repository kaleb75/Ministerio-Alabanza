/**
 * Microsoft OAuth 2.0 PKCE flow — no external libraries.
 * Works with personal Microsoft accounts (live.com / hotmail / outlook).
 *
 * SETUP (one time, ~5 minutes):
 * 1. Go to https://portal.azure.com → "App registrations" → "New registration"
 * 2. Name: "Ministerio Alabanza" (any name)
 * 3. Supported account types: "Accounts in any organizational directory AND personal Microsoft accounts"
 * 4. Redirect URI: Single-page application → http://localhost:5173/auth/callback
 *    (Also add your production URL if deployed)
 * 5. After creating: copy "Application (client) ID"
 * 6. Under "Authentication" tab → enable "Allow public client flows"
 * 7. Under "API permissions" → Add → Microsoft Graph → Delegated → Files.Read, Files.Read.All
 * 8. Paste the client ID in Settings → OneDrive inside the app
 */

const TENANT      = 'consumers'; // personal Microsoft accounts
const AUTH_ORIGIN = 'https://login.microsoftonline.com';
const AUTH_URL    = `${AUTH_ORIGIN}/${TENANT}/oauth2/v2.0/authorize`;
const TOKEN_URL   = `${AUTH_ORIGIN}/${TENANT}/oauth2/v2.0/token`;
const SCOPES      = 'Files.Read Files.Read.All User.Read offline_access';

const SK = {
  token:    'ms_access_token',
  expiry:   'ms_token_expiry',
  verifier: 'ms_pkce_verifier',
  state:    'ms_oauth_state',
  user:     'ms_user_display',
  clientId: 'ms_client_id',
};

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function generateVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  // base64url-encode
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ─── Client ID config ─────────────────────────────────────────────────────────

export function saveClientId(id) {
  localStorage.setItem(SK.clientId, id.trim());
}

export function getClientId() {
  return localStorage.getItem(SK.clientId) || '';
}

// ─── Token storage ────────────────────────────────────────────────────────────

export function getStoredToken() {
  const token  = sessionStorage.getItem(SK.token);
  const expiry = parseInt(sessionStorage.getItem(SK.expiry) || '0', 10);
  if (!token || Date.now() >= expiry - 60_000) return null; // 1-min buffer
  return token;
}

export function getStoredUser() {
  return sessionStorage.getItem(SK.user) || '';
}

export function isAuthenticated() {
  return Boolean(getStoredToken());
}

export function logout() {
  [SK.token, SK.expiry, SK.verifier, SK.state, SK.user].forEach(
    (k) => sessionStorage.removeItem(k)
  );
}

// ─── Token exchange ───────────────────────────────────────────────────────────

async function exchangeCode(clientId, code, verifier) {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     clientId,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      code_verifier: verifier,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `Token error ${res.status}`);
  }

  const expiry = Date.now() + data.expires_in * 1000;
  sessionStorage.setItem(SK.token,  data.access_token);
  sessionStorage.setItem(SK.expiry, expiry.toString());

  // Decode display name from id_token if present
  if (data.id_token) {
    try {
      const payload = JSON.parse(atob(data.id_token.split('.')[1]));
      sessionStorage.setItem(SK.user, payload.name || payload.preferred_username || '');
    } catch {}
  }

  return data.access_token;
}

// ─── Popup OAuth flow ─────────────────────────────────────────────────────────

export async function login(clientId) {
  if (!clientId) throw new Error('Client ID de Azure no configurado.');

  const verifier   = generateVerifier();
  const challenge  = await generateChallenge(verifier);
  const state      = crypto.randomUUID();
  const redirectUri = `${window.location.origin}/auth/callback`;

  sessionStorage.setItem(SK.verifier, verifier);
  sessionStorage.setItem(SK.state, state);

  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         'code',
    redirect_uri:          redirectUri,
    scope:                 SCOPES,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    state,
    prompt:                'select_account',
  });

  const authUrl = `${AUTH_URL}?${params}`;
  const width   = 480;
  const height  = 660;
  const left    = Math.round(window.screenX + (window.outerWidth  - width)  / 2);
  const top     = Math.round(window.screenY + (window.outerHeight - height) / 2);
  const popup   = window.open(
    authUrl, 'ms_auth',
    `width=${width},height=${height},left=${left},top=${top},popup=1`
  );

  if (!popup) {
    throw new Error('El navegador bloqueó el popup. Permite popups para este sitio e inténtalo de nuevo.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    function settle(fn, val) {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearInterval(pollTimer);
      fn(val);
    }

    function onMessage(evt) {
      if (evt.origin !== window.location.origin) return;
      if (evt.data?.type !== 'MS_AUTH_CODE')     return;
      if (evt.data.state !== sessionStorage.getItem(SK.state)) return;

      const { code, error } = evt.data;
      if (error) { settle(reject, new Error(error)); return; }
      if (!code)  { settle(reject, new Error('Sin código de autorización.')); return; }

      const storedVerifier = sessionStorage.getItem(SK.verifier);
      exchangeCode(clientId, code, storedVerifier)
        .then((token) => settle(resolve, token))
        .catch((err)  => settle(reject, err));
    }

    // Poll for popup closed (user cancelled)
    const pollTimer = setInterval(() => {
      if (popup.closed && !settled) {
        settle(reject, new Error('Autenticación cancelada.'));
      }
    }, 800);

    window.addEventListener('message', onMessage);
  });
}
