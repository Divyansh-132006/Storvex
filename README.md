# UFDS Authentication Module

Universal File Distribution System (UFDS) authentication is a monorepo with an Express/MongoDB API and a Vite/React client.

## Prerequisites

- Node.js 18 or newer
- MongoDB (local or MongoDB Atlas)
- A Google OAuth 2.0 Web application client ID

## Setup

### 1. Server

```powershell
cd server
npm install
copy .env.example .env
```

Set every required value in `server/.env`, especially `MONGODB_URI`, `JWT_ACCESS_SECRET`, `CLIENT_URL`, and `GOOGLE_CLIENT_ID`. Generate a JWT secret with enough randomness, for example:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start MongoDB, then run:

```powershell
npm run dev
```

The API listens on `http://localhost:5000`.

### Distributed encrypted storage

New uploads use encrypted 4+1 distribution by default. ChaCha20-Poly1305
encryption runs first; each encrypted stream is split into 1 MiB blocks,
grouped as four data shards plus one XOR parity shard, and placed at provider
positions 1-5. The parity position rotates by group:

```text
group 0: P D0 D1 D2 D3
group 1: D0 P D1 D2 D3
group 2: D0 D1 P D2 D3
```

The layout tolerates one unavailable or corrupt shard per group. Two bad
shards in one group are unrecoverable. The default development setup uses five
GridFS buckets (`provider1` through `provider5`); these buckets in one Atlas
cluster are simulated providers, not independent failure domains. For real
failure domains set each `PROVIDER_N_TYPE=s3` and configure the S3-compatible
endpoint and credentials (Backblaze B2, Filebase, Wasabi, or a Storj gateway).

Providers receive random shard object keys and ciphertext only. MongoDB stores
file metadata, shard positions, sizes, and SHA-256 hashes, but never keys,
plaintext names, or plaintext hashes. SHA-256 detects corruption but is not
authentication: hashes must be protected, and Poly1305 decryption remains the
final integrity check.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/files/:id/health` | Owner-only group/provider health |
| GET | `/api/admin/providers` | Admin provider and circuit status |
| POST | `/api/admin/providers/:index/fault` | Development fault injection |
| POST | `/api/admin/repair/run` | Run one repair pass |

Set `ENABLE_FAULT_INJECTION=true` outside production to demo an outage:
offline one provider, download successfully through parity, then run repair.
The upload path keeps at most two groups in flight by default; a manual 1 GB
test should confirm memory remains approximately constant.

### Keeping the existing frontend and authentication gateway

Deploy in this order: (1) the `storvex-storage` service, (2) the
`storvexx-backend` gateway, then (3) the frontend. Set the gateway's
`DISTRIBUTED_STORAGE_URL` to the storage service's HTTPS base URL. Set the
same `JWT_ACCESS_SECRET`, `MONGODB_URI`, and high-entropy
`INTERNAL_SERVICE_TOKEN` on both backend services. The gateway forwards the
user access JWT and adds the internal token; the storage API rejects direct
file requests without both. Keep the token server-side and never expose it to
the frontend.

The storage service also needs `NODE_ENV=production`, `MASTER_KEY_V1`,
`CURRENT_KEY_VERSION`, `GOOGLE_CLIENT_ID`, `CLIENT_URL`, and explicitly set
`PROVIDER_1_TYPE` through `PROVIDER_5_TYPE`. For real cloud storage, set each
provider type to `s3` and supply the matching `PROVIDER_N_BUCKET`,
`PROVIDER_N_REGION`, optional `PROVIDER_N_ENDPOINT`, and credentials (or
configure the hosting platform's supported AWS credential provider). Never
set `ALLOW_SIMULATED_PROVIDERS=true` for a production deployment using real
cloud failure domains. The gateway needs its MongoDB/JWT settings,
`INTERNAL_SERVICE_TOKEN`, `DISTRIBUTED_STORAGE_URL`, Google OAuth values, and
the production frontend URL. The frontend needs `VITE_API_URL` pointing to the
gateway.

The storage service warns if multiple provider slots share an endpoint and
account. Set `PROVIDER_N_ACCOUNT_ID` when different credentials belong to the
same cloud account so the warning can identify shared failure domains; the
account identifier is not a credential.

The 4+1 server stores its file metadata in the `distributedfiles` collection,
separate from legacy GridFS records. The gateway merges both file lists and
continues serving existing GridFS files.

On startup, the 4+1 service copies any pre-existing distributed metadata from
the old `files` collection into `distributedfiles` without deleting the source
records; this keeps files created by an earlier standalone deployment readable.

For local use, run the 4+1 server on a different port from the gateway (for
example, 5001), set `DISTRIBUTED_STORAGE_URL=http://localhost:5001` in
`ufds-backend/.env`, and set the same `INTERNAL_SERVICE_TOKEN` in both backend
`.env` files. Production startup fails if the gateway lacks a distributed
storage URL or either service lacks the internal token. The gateway's legacy
single-GridFS upload path is disabled by default; only explicitly set
`ALLOW_LEGACY_UPLOAD=true` to enable it outside a production configuration.

The checked-in `render.yaml` declares environment variable names only. Add
secret values in the Render dashboard; do not commit them to YAML or source.

Both storage and gateway downloads perform a complete decrypt/authentication
pass before starting the response, then stream a second pass to the client.
They use bounded stream buffers rather than buffering the whole plaintext or
writing temporary plaintext files. The 100 MiB heap/RSS measurement and
provider/erasure checks are available with `npm run verify:system` from
`server`; the harness uses an isolated in-memory MongoDB and deletes its test
files and random provider objects afterward.

### 2. Client

```powershell
cd ../client
npm install
copy .env.example .env
npm run dev
```

Set `VITE_GOOGLE_CLIENT_ID` in `client/.env` to the same Google Web OAuth client ID used by the server.

The app is available at `http://localhost:5173`.

## Google OAuth setup

1. Open Google Cloud Console and create or select a project.
2. Open **APIs & Services > OAuth consent screen**, configure it, and add your test users if the app is in testing mode.
3. Open **APIs & Services > Credentials** and create an **OAuth 2.0 Client ID** with application type **Web application**.
4. Add these authorized JavaScript origins:
   - `http://localhost:5173`
   - Your deployed Netlify URL, for example `https://your-app.netlify.app`
5. Add these authorized redirect URIs for the Storvex Express OAuth flow:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://<your-render-service>.onrender.com/api/auth/google/callback`
6. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into `ufds-backend/.env`.
   Keep the secret in the backend environment only; never add it to `ufds-frontend/.env` or frontend source.
7. Do not place a Google client secret in the frontend.

For a production OAuth consent screen, configure the production domain and follow Google's verification requirements if required.

## API

Base URL: `/api/auth`

| Method | Endpoint | Protected | Purpose |
|---|---|---:|---|
| POST | `/signup` | No | Create a local account and start a session |
| POST | `/login` | No | Log in with email and password |
| POST | `/google` | No | Log in or link/create an account with a Google ID token |
| POST | `/refresh` | Cookie | Rotate the refresh token and issue a new access token |
| POST | `/logout` | No | Revoke the current refresh token and clear the cookie |
| GET | `/me` | Bearer token | Return the current user profile |

All responses use `{"success": true|false, "message": "...", ...}`. A protected request requires `Authorization: Bearer <accessToken>`.

## Example requests

### Signup

`POST http://localhost:5000/api/auth/signup`

```json
{
  "name": "Alex Morgan",
  "email": "alex@example.com",
  "password": "SecurePass123"
}
```

Example success:

```json
{
  "success": true,
  "user": {
    "id": "64f...",
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "authProvider": "local",
    "avatar": null,
    "role": "user",
    "emailVerified": false
  },
  "accessToken": "<JWT>"
}
```

The refresh token is returned only in an HttpOnly cookie, never in JSON.

### Login

`POST http://localhost:5000/api/auth/login`

```json
{
  "email": "alex@example.com",
  "password": "SecurePass123"
}
```

Example success has the same shape as signup. Invalid credentials return `401`:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Google Sign-In

`POST http://localhost:5000/api/auth/google`

```json
{
  "idToken": "<credential returned by GoogleLogin>"
}
```

Example success:

```json
{
  "success": true,
  "user": {
    "id": "64f...",
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "authProvider": "google",
    "avatar": "https://...",
    "role": "user",
    "emailVerified": true
  },
  "accessToken": "<JWT>"
}
```

### Refresh

`POST http://localhost:5000/api/auth/refresh`

Send no body. Enable credentials/cookies in the client. Example success:

```json
{
  "success": true,
  "user": {
    "id": "64f...",
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "role": "user"
  },
  "accessToken": "<new JWT>"
}
```

The old refresh cookie is replaced by a newly rotated cookie. Reusing an already revoked refresh token revokes every active refresh token for that user.

### Logout

`POST http://localhost:5000/api/auth/logout`

```json
{
  "success": true,
  "message": "Logged out"
}
```

### Current user

`GET http://localhost:5000/api/auth/me`

Header:

```text
Authorization: Bearer <JWT>
```

Example success:

```json
{
  "success": true,
  "user": {
    "id": "64f...",
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "authProvider": "local",
    "role": "user",
    "emailVerified": false
  }
}
```

Missing or invalid access tokens return `401 {"success":false,"message":"Authentication required"}`.

## Encrypted files

Generate a master key and place it in `server/.env` (never commit it):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set it as `MASTER_KEY_V1`, then configure `STORAGE_DIR`, `MAX_FILE_SIZE_MB`,
`MAX_USER_STORAGE_MB`, and `UNIT_SIZE_BYTES`. Install dependencies and run the
backend tests with `npm install` and `npm test` from `server` (the current
authentication baseline uses syntax checks; file integration tests require a
MongoDB test instance).

### File API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/files/upload` | Stream one multipart `file`, encrypt, and store it |
| GET | `/api/files` | List the authenticated user's committed files |
| GET | `/api/files/:id/download` | Authenticated owner-only streaming download |
| DELETE | `/api/files/:id` | Idempotent owner-only deletion |

The database contains the owner, status, timestamps, sizes, unit count, key
version, random file salt, encrypted metadata, ciphertext SHA-256, and random
storage key. The encrypted blob contains only ciphertext and authentication
tags. It contains no plaintext name or file content. See [SECURITY.md](./SECURITY.md).

## Deployment

### Render (backend)

- Set the environment variables from `server/.env.example`.
- Set `NODE_ENV=production`.
- Set `COOKIE_SECURE=true`.
- Set `COOKIE_SAMESITE=none`.
- Set `CLIENT_URL` to the exact deployed Netlify origin.
- Start command: `npm start`
- Working directory: `server`

### Netlify (frontend)

- Set `VITE_API_URL` to `https://<render-service>/api`.
- Set `VITE_GOOGLE_CLIENT_ID` to the Google Web OAuth client ID.
- Build command: `npm run build`
- Publish directory: `client/dist`
- Add the Netlify URL to the Google OAuth authorized JavaScript origins.

Cross-domain cookies require `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, HTTPS on both sites, `withCredentials: true`, and an exact CORS `CLIENT_URL` value.
