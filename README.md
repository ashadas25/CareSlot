# CareSlot — Clinic Appointment & Doctor Management Platform

CareSlot is a full-stack appointment coordination demo built as two independently deployable backend microservices and a React frontend.

## Architecture

- **Appointment & Identity Service** (`server/`, port 5000): patient/staff authentication, appointment CRUD and support requests. Owns its MongoDB database.
- **Clinic Directory Service** (`server/clinic-service/`, port 5001): clinic branches, specialties and doctors. Owns a separate MongoDB database named `careslot_directory`.
- **Inter-service REST:** the appointment service validates branch/doctor IDs and retrieves display details through authenticated internal REST endpoints on the directory service. Both services must have the same `SERVICE_API_KEY`.
- **Frontend** (`client/`, port 5173): React/Vite uses Axios to call the appointment and directory APIs separately.
- **In-app emergency alerts:** visitors can save an urgent alert for a selected branch. Its staff dashboard polls every 10 seconds and can show browser notifications when staff enables them.

Directory records and doctor profiles created by the seed are fictional demo data. Replace them with verified clinic information before real use. Emergency alerts are only visible in the CareSlot staff portal; the app does not contact ambulance dispatch, call 112, or send SMS/email notifications. For immediate danger, call 112.

## Local setup

1. Install Node.js 20 or newer and create a MongoDB Atlas cluster. Use a database user and allow your current IP in Atlas Network Access.
2. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` to your Atlas connection string; set a random `JWT_SECRET` of at least 32 characters; and create separate random values for `SERVICE_API_KEY`, `ADMIN_SETUP_KEY`, and `CLINIC_ADMIN_KEY`. Do not commit `.env`.
3. Use the same `MONGODB_URI` for both services. The directory service selects its separate database with `MONGODB_DB_NAME=careslot_directory`. Locally, `CLINIC_PORT=5001` keeps it separate from the appointment service on 5000. The clinic service reads `server/.env` for local development; on a cloud host, set its variables in that service's environment settings and leave `CLINIC_PORT` unset so the host-provided `PORT` is used.
4. Copy `client/.env.example` to `client/.env` if you need to change the local API addresses.
5. In the project folder, install dependencies with `npm install`, `npm --prefix server install`, `npm --prefix server/clinic-service install`, and `npm --prefix client install`.
6. Seed the clinic branches and demo clinicians with `npm --prefix server/clinic-service run seed` (or `npm --prefix server run seed`). This writes to the `careslot_directory` database.
7. Start all three local processes with `npm run dev`. Open `http://localhost:5173`. The appointment API health endpoint is `http://localhost:5000/api/health`; the directory API health endpoint is `http://localhost:5001/api/health`.

### Administrator sign-in and first-time setup

- Patients use **Patient sign in**. Hospital administrators use **Admin sign in** in the navigation or open `/admin` directly.
- On the admin sign-in dialog, choose **Register admin** the first time. Enter the administrator’s name, email, password, phone, and primary hospital branch. The form does not ask for a setup key.
- The hospital list comes from the Clinic Directory Service. Seed the directory before setup. The selected hospital is saved on the admin account; admins can still manage the whole directory.
- If that email already belongs to a patient account, the setup form assigns that existing account administrator access and updates its password and hospital. After setup succeeds, use **Admin sign in** with that email and the password you set.
- First-admin registration is enabled only on the local development computer, and only while no administrator exists. The server limits setup attempts. Remote or production setup must be provisioned by the server owner with the private setup key; never put that key in client source code or share it in chat.

### API overview

Appointment service: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/appointments`, `GET /api/appointments/mine`, `GET /api/appointments/hospital`, `PATCH /api/appointments/:id/status`, and `/api/support`.

Directory service: `GET /api/hospitals?region=Chennai`, `GET /api/doctors?hospitalId=…&specialty=…&day=…`, and admin-key protected clinic/doctor create, update and deactivate routes. Internal service-to-service routes live under `/api/internal` and require the shared `x-service-key` header.

The booking form offers **Any available doctor** or a named clinician available at the selected branch, specialty and weekday. A selected doctor and the branch are validated again by the appointment service through REST before the booking is stored.

## Independent deployment (for the later deployment phase)

- Deploy `server/` as one service and `server/clinic-service/` as a second service, each with its own start command (`npm start`) and independently configured environment variables. Give the clinic service its own `PORT` and `MONGODB_DB_NAME=careslot_directory`.
- Set the appointment service's `CLINIC_SERVICE_URL` to the deployed directory service URL ending in `/api`. Set the same strong `SERVICE_API_KEY` on both backend services.
- Deploy `client/` separately and set `VITE_API_URL` and `VITE_CLINIC_API_URL` to the respective deployed backend URLs ending in `/api`. Allow the frontend origin in each service's `CLIENT_URL`.
- The current code is prepared for this deployment layout; cloud deployment has not been performed yet.

## Deployment checklist

- `render.yaml` defines the appointment API and clinic directory as separate Render web services. Create them from the GitHub repository using Render's Blueprint flow.
- In Render, set `MONGODB_URI` for each backend service to the Atlas connection string. Set `SERVICE_API_KEY` to the **same strong value** on both services, and set both `CLIENT_URL` values to the deployed Vercel origin.
- Set `CLINIC_SERVICE_URL` on the appointment API to the directory service's public URL ending in `/api`. Set separate strong values for `ADMIN_SETUP_KEY` and `CLINIC_ADMIN_KEY`. Render generates `JWT_SECRET` from the Blueprint.
- In Vercel, import the repository and set the project root directory to `client`. Add `VITE_API_URL` and `VITE_CLINIC_API_URL`, each pointing to its Render service URL ending in `/api`. The included `client/vercel.json` provides client-side route fallback.
- After deploying, use the Postman collection in `docs/` to check health and bootstrap the first production administrator. Keep setup keys and credentials in Postman variables or provider environment settings; never commit them.
- Atlas must allow connections from the deployed Render services. Use verified branch/doctor data before sharing the demo, and do not use it for real patient records.
## Safety

CareSlot is for appointment coordination, not diagnosis or emergency dispatch. The emergency panel directs users in India to call **112** or go to the nearest emergency department. Do not wait for an online booking during an emergency. Seeded branch addresses and doctor profiles are fictional.

See `docs/DATABASE_SCHEMA.md` and `docs/API.md` for the database structures and API details.
