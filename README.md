# 9Router on Shiprr

A source-based deployment wrapper for [9Router](https://github.com/decolua/9router) tailored for [Shiprr](https://shiprr.app/). Shiprr currently deploys source projects and does not support custom Dockerfiles or prebuilt container images, so this package intentionally uses `package.json` instead of Docker.

## Default dashboard password

The initial dashboard password defaults to:

`admin`

**Security warning:** this is a weak password. Anyone who can reach a public dashboard may try it. Change the password after first login, or set `INITIAL_PASSWORD` to a strong unique value in Shiprr's environment settings before the first start. `INITIAL_PASSWORD` only initializes a fresh database; it does not overwrite a password already saved in existing app data.

## Deploy on Shiprr

1. Extract this ZIP.
2. Push the files (`package.json`, `launcher.js`, and this README) to a GitHub repository. Do not add a Dockerfile for this Shiprr deployment.
3. Import the repository into Shiprr and deploy the `main` branch.
4. In **Settings → Build & Runtime**, use:
   - Build command: `npm install --omit=dev`
   - Start command: `npm start`
5. Make sure the app is configured as a Node.js app and use Node.js 22 or newer.
6. Open the generated Shiprr domain. The app should listen on the platform-provided `PORT`.

## Optional environment variables

- `INITIAL_PASSWORD`: Defaults to `admin` for a fresh installation.
- `PORT`: Normally supplied by Shiprr; the launcher uses `20128` only as a fallback.
- `DATA_DIR`: Defaults to `~/.9router`.
- `JWT_SECRET`, `API_KEY_SECRET`, `MACHINE_ID_SALT`: Automatically generated and saved locally on first start if not set manually.
- `NODE_ENV`: Defaults to `production`.
- `AUTH_COOKIE_SECURE`: Defaults to `true` for Shiprr's HTTPS domain.
- `REQUIRE_API_KEY`: Defaults to `true` for internet-exposed `/v1/*` API routes. API clients should use a key generated in the 9Router dashboard. Set it to `false` only if you knowingly want unauthenticated API access.

## Important storage limitation

Shiprr documents its app filesystem as ephemeral rather than persistent. 9Router stores dashboard configuration, provider credentials, API keys, and usage data locally. Those may be lost after redeploys or when the instance filesystem is replaced. Export or back up important configuration before redeploying, and check Shiprr's current storage options.

## API endpoint

After deployment, the API base URL is typically:

`https://YOUR-SHIPRR-DOMAIN/v1`

Replace `YOUR-SHIPRR-DOMAIN` with the actual assigned domain.

## Troubleshooting

- **Build fails:** open the failed deployment's build logs; verify Node.js 22+, the `npm install --omit=dev` build command, and registry access.
- **App exits immediately:** open runtime logs and confirm `npm start` is the start command.
- **Dashboard returns a gateway error:** confirm the process binds to `0.0.0.0` and listens on the `PORT` value supplied by Shiprr.
- **Password `admin` does not work:** it only seeds the password for a fresh database. Existing saved authentication data may keep an earlier password.

This wrapper installs the published 9Router npm package at version `0.5.104`. See the official project for the upstream source and documentation: https://github.com/decolua/9router
