# Doorstep Kenya

Doorstep is a Kenyan property discovery and realtor lead-generation platform. Buyers, long-term renters, and short-stay travellers can discover homes and contact the realtor or host. Doorstep does not currently take bookings, deposits, rent, sale proceeds, or commissions.

## Product status

This repository contains a working full-stack MVP and local deployment setup. It is not yet ready for unrestricted public or commercial launch. The implementation provides:

- Search-first React marketplace with separate **For sale**, **For rent**, and **For short stays** modes, location/type/price filters, mapped results, saved homes, property details, and direct inquiry/contact actions.
- Traveller search for destination, check-in/check-out dates, guest count, nightly budget, guest capacity, minimum nights, and the host's broad availability window. Dates and guests are sent to the host for confirmation; there is no reservation calendar or instant booking.
- Realtor accounts and password plus email one-time-code sign-in. OTPs are hashed, expire after 10 minutes, and allow at most five attempts. Sessions use an 8-hour HttpOnly, SameSite cookie.
- Realtor listing submission and owner-scoped management, including up to 10 JPG, PNG, WebP, or AVIF photos (8 MB each). Development files use local storage; production uploads use Cloudinary.
- MongoDB persistence for users, listings, inquiries, agency applications/memberships, and saved properties.
- Admin endpoints and workspace for realtor verification, listing moderation, and agency/membership review.
- Docker images and Compose services for the client, API, and MongoDB with persistent database/media volumes.

Sample listings are illustrative only; they are not real estate offers. The current client falls back to these samples whenever listing search fails, including in a production build. Disable that fallback or fail closed before public launch, then use only authorized, verified inventory.

## Architecture and changes

- `client/`: React, TypeScript, Vite, Lucide icons, responsive marketplace, OTP dialog, realtor studio, multi-image form, and admin review workspace.
- `src/app.ts`: Express API bootstrap, security headers, CORS, rate limits, cookie parsing/origin checks, health reporting, media serving, and MongoDB connection retries.
- `src/models/`: Mongoose schemas for accounts, agencies/memberships, listings, and inquiries. Listing fields include sale/monthly/nightly price periods and GeoJSON coordinates for future proximity queries.
- `src/routes/`: auth/OTP, listing search and owner CRUD, inquiries, saved homes, agencies, uploads, and admin moderation.
- `Dockerfile`, `client/Dockerfile`, `compose.yaml`, and `client/nginx.conf`: production builds, internal API routing, and local Compose deployment.
- `.env.example` and `.env.compose.example`: local host-development and Compose configuration templates. They contain placeholders, not production credentials.

## Run locally

Requires Node.js 22+ and a reachable MongoDB instance. From the repository root, open two terminals.

API terminal:

```sh
cd doorstep
cp .env.example .env
npm ci
npm run dev
```

Set `MONGODB_URI` in `doorstep/.env` to your local or hosted development database. The example defaults to unauthenticated local MongoDB at `127.0.0.1:27017/doorstep`. Keep `NODE_ENV` unset or set it to `development` for local use.

Client terminal:

```sh
cd doorstep/client
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/media` to the API on port 3000. The client displays sample listings if the API/database is unavailable; account, saved-home, inquiry, and listing writes require MongoDB.

In development, the OTP is returned to the client and displayed in the sign-in dialog. This is for local testing only. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` to test actual email delivery. Without Cloudinary configured, development uploads are written under `doorstep/uploads/` and are ignored by Git.

Build both applications:

```sh
cd doorstep
npm run build
cd client
npm run build
```

There is currently no automated test suite; builds/type checks and manual API smoke checks are the available validation gates.

## Local Docker

Docker Compose runs the web app at `http://localhost:8080`, API, and MongoDB. From `doorstep/`:

```sh
cp .env.compose.example .env
# Edit both MongoDB passwords/URI and replace the JWT placeholder.
docker compose up --build -d
docker compose ps
```

This example is for local HTTP development: `NODE_ENV=development`, `COOKIE_SECURE=false`, and SMTP/Cloudinary are optional. Development OTPs are shown in the browser and image files persist in the named `realtor-media` volume. `docker compose down` stops services but keeps volumes. MongoDB data and uploaded media should be treated as persistent user data.

To follow service logs:

```sh
docker compose logs -f api
```

The API health endpoint is `GET /api/health`; it reports HTTP 503 while MongoDB is disconnected. Do not treat a running web container as proof that the API/database are ready.

## Admin bootstrap

1. Register an account as a realtor and complete email OTP verification.
2. From `doorstep/`, build the API and promote that account using its email:

```sh
npm run build
ADMIN_EMAIL=admin@example.co.ke npm run create-admin
```

3. Sign out and back in to receive the admin-scoped session.

Never expose this command through the public client or commit credentials. Provision a second trusted administrator and document a recovery procedure before commercial launch.

## API reference

- `GET /api/health`: API/database readiness.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/verify-otp`, `POST /api/auth/logout`: account registration, password + email OTP, cookie session, sign-out.
- `POST /api/auth/become-realtor`: upgrade a verified seeker account to an unverified realtor profile.
- `GET /api/listings`: verified public search. Example short-stay query:

```text
/api/listings?purpose=short_stay&location=Mombasa&checkIn=2026-11-04&checkOut=2026-11-08&guests=2&maxPrice=20000
```

- `GET /api/listings/:id`: verified public listing detail; `GET /api/listings/mine`: signed-in realtor inventory.
- `POST /api/listings`, `PATCH /api/listings/:id`, `DELETE /api/listings/:id`: realtor-owned listing workflow. New/edited listings return to pending review.
- `POST /api/uploads/images`: authenticated realtor image upload; up to 10 allowed image files, 8 MB each.
- `POST /api/inquiries`: rate-limited lead capture; persists the inquiry and emails the owner when SMTP is configured.
- `/api/agencies`: agency application, directory, and realtor membership request endpoints.
- `/api/admin`: admin-only realtor verification, listing approval/rejection, and agency/membership decisions.
- `/api/users/saved`: signed-in saved-home listing and updates.

Sale prices are stored as total KSh; long-term rent as monthly KSh; short stays as nightly KSh. Short-stay date/capacity filters represent listing availability metadata, not a live reservation calendar. A host confirms a request directly. No payments or bookings are processed on-platform.

## Work pending

Before a public pilot:

- Add integration tests for OTP, role authorization, listing ownership/moderation, agency membership, short-stay date/guest search, uploads, and inquiries. Add CI for client/API builds, Compose validation, and tests.
- Test with a reachable staging MongoDB, SMTP account, Cloudinary account, real email domains, and actual mobile devices. The current Codespaces Docker bridge has previously blocked container-to-container traffic; confirm connectivity in the intended hosting environment.
- Add password reset/account recovery, email change verification, login/session revocation, admin audit history, and clear account deletion/data-export workflows.
- Add a complete availability calendar, date-conflict prevention, booking requests/status tracking, cancellation rules, and notifications only if Doorstep decides to process reservations. Current short-stay date filtering uses broad availability bounds only.
- Disable the client sample-listing fallback in production. On API/database errors, show an explicit service-unavailable state instead of illustrative listings.
- Add upload cleanup for abandoned drafts/replaced images, listing expiry/relist workflows, pagination, geocoding, real map pins, and accessible image-gallery keyboard controls.
- Replace sample inventory with realtor-authorized property data, verify phone/email ownership, and collect/validate evidence for realtor and agency credentials. Current verification decisions are manual.
- Configure production SMTP, Cloudinary, MongoDB backups/restore drills, logging/monitoring/alerts, rate-limit strategy for multiple API replicas, and incident response.
- Decide a commercial model (for example realtor subscriptions or paid listing promotion) only after pricing, refunds, invoicing, support ownership, and advertising disclosure are documented. Billing is not implemented.

## Public and commercial launch guide

### 1. Confirm the service promise

Decide whether launch is a listings/lead directory or a booking marketplace. The current product is a discovery and direct-contact directory. Do not advertise guaranteed availability, instant reservations, escrow, rent collection, or buyer protection unless those systems and operating policies are built and tested.

### 2. Complete Kenya-specific legal and business review

- Obtain Kenyan legal advice on terms of service, privacy notice, cookie/session disclosures, listing content rules, liability boundaries, complaint handling, and consumer-facing price/fee disclosures.
- Assess obligations under Kenya's Data Protection Act and ODPC registration guidance for the business and its data-processing activities. Define lawful purpose, consent where required, data retention/deletion, data-subject requests, processor contracts, and breach response.
- Verify realtor and agency claims against the relevant Estate Agents Registration Board requirements and maintain an auditable evidence/review process. Confirm county rules/permits and other obligations for marketed short-stay accommodation with qualified counsel and the relevant authorities.
- Confirm KRA tax, invoicing, VAT, and company-registration obligations for the selected commercial model. This README is operational guidance, not legal or tax advice.
- Publish a clear commercial policy for promoted listings/subscriptions. If payments are added later, select a compliant payment provider and implement refunds, disputes, reconciliation, fraud controls, and customer support first.

### 3. Provision production services

- Use a managed MongoDB deployment or hardened private MongoDB host with authentication, TLS, automated backups, point-in-time recovery where available, least-privilege credentials, and a tested restore.
- Configure SMTP with SPF, DKIM, DMARC, verified sender/domain, bounce monitoring, and delivery alerts.
- Configure a production Cloudinary account, upload quotas, image transformations, access policy, retention, and billing alerts.
- Provision a domain, TLS certificate, trusted reverse proxy/load balancer, DNS, uptime monitoring, error reporting, and centralized logs. Restrict API/database access to the private application network.

### 4. Set production configuration

Use a secret manager or protected deployment environment, not a committed `.env` file. Set at least:

- `NODE_ENV=production`
- `MONGODB_URI` to the private authenticated production database
- `JWT_SECRET` to a unique random secret of at least 32 characters
- `COOKIE_SECURE=true`
- `CLIENT_URL` to the exact public HTTPS origin
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`

Production startup intentionally fails if required database, origin, email, image-storage, or JWT configuration is missing. Never use the development OTP response or `COOKIE_SECURE=false` publicly.

### 5. Release procedure

1. Create a release candidate from a reviewed commit; do not build production images from a developer working tree.
2. Run both `npm run build` commands, tests/CI, `docker compose config`, dependency/security scans, and a staging end-to-end test.
3. Deploy API and web images to staging; run database migrations/index checks, smoke `/api/health`, verify OTP email, upload several images, search and inquire, approve/reject listings, and check mobile layouts.
4. Promote the same immutable images to production. Enable HTTPS, set exact CORS origin and Secure cookies, provision backups/monitoring, then create the first admin through the private CLI procedure.
5. Start with a limited realtor/property pilot. Verify listing accuracy and credential evidence, monitor inquiry delivery, support requests, and abuse reports, then expand only after operational sign-off.
6. Document rollback to the previous image and database recovery. Preserve MongoDB/media volumes during routine deployments; never remove persistent volumes as part of an ordinary release.

## Go-live checklist

- [ ] Legal, privacy, data-retention, terms, complaint, and commercial policies reviewed for Kenya.
- [ ] Authorized real listings and verified realtor/agency evidence; sample records removed from production.
- [ ] Production search fails closed when the API/database is unavailable; sample listings cannot be mistaken for real offers.
- [ ] Production MongoDB connectivity, least-privilege credentials, backups, and restore drill verified.
- [ ] HTTPS, `CLIENT_URL`, Secure cookies, secret manager, SMTP deliverability, and Cloudinary uploads verified.
- [ ] OTP abuse, role/ownership checks, moderation, short-stay guest/date filters, and anonymous API limits tested.
- [ ] Admin bootstrap, audit/incident ownership, user support, takedown, and data-subject request procedures assigned.
- [ ] CI tests, monitoring, alerts, rollback plan, and release owner approved.
- [ ] Commercial fees, invoice/tax handling, refunds, and payment responsibilities documented; no unimplemented fees advertised.