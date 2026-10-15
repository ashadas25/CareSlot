# REST API reference

Import [CareSlot.postman_collection.json](./CareSlot.postman_collection.json) into Postman for the local API request collection. Set the hospital ID variable from the directory API and use test accounts only.


Base URL: `/api`. Protected endpoints require `Authorization: Bearer <JWT>`.

Example staff provisioning body (send once from a trusted Postman session with the setup key in the `x-setup-key` header):

```json
{
  "name": "Hospital Coordinator",
  "email": "coordinator@example.org",
  "password": "use-a-unique-password",
  "phone": "+91 90000 00000",
  "role": "staff",
  "hospitalId": "<hospital ObjectId from Directory Service GET /api/hospitals>"
}
```

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | API and database health. |
| GET | `http://localhost:5001/api/hospitals?region=Coimbatore` | Public | Active clinic branches from the Directory Service. |
| GET | `http://localhost:5001/api/doctors?hospitalId=...&specialty=...&day=...` | Public | Available clinicians for the selected branch/specialty/day. |
| GET | `http://localhost:5001/api/health` | Public | Clinic Directory Service health. |
| POST | `/auth/register` | Public patient signup | Create a patient account. Staff provisioning additionally requires `x-setup-key`, a hospital ID, and server setup secret. |
| GET | `/auth/admin-setup-status` | Public | Reports whether first-admin setup is available from this local development computer. |
| POST | `/auth/provision-admin` | First admin: local development only; remote bootstrap: setup key | Create the first administrator and assign a primary hospital, or promote an existing account with the same email to admin. First-admin web setup works only from localhost while no admin exists. Rate limited. |
| POST | `/auth/login` | Public | Sign in and receive a JWT. |
| GET | `/auth/me` | Signed in | Read current user profile. |
| POST | `/appointments` | Patient | Send appointment request to selected hospital. |
| GET | `/appointments/mine` | Patient | List own appointments. |
| GET | `/appointments/hospital` | Staff | List assigned hospital appointment queue. |
| PATCH | `/appointments/:id/status` | Staff | Confirm, complete, or cancel a hospital appointment. |
| POST | `/emergency-alerts` | Public, rate limited | Save an urgent in-app alert for a selected directory branch. |
| GET | `/emergency-alerts/hospital` | Staff | Poll alerts routed to the staff member’s branch (admins can view all). |
| PATCH | `/emergency-alerts/:id` | Staff | Acknowledge or resolve an alert for the staff member’s branch. |
| POST | `/support` | Public | Submit a help question. |
| GET | `/support` | Admin | Review the support inbox. |
| PATCH | `/support/:id/status` | Admin | Mark a support ticket open, in progress, or resolved. |

Administrator setup body (the CareSlot `/admin` setup screen sends this request after the user selects a primary hospital; it does not ask for a setup key):

```json
{
  "name": "Hospital Administrator",
  "email": "admin@example.org",
  "password": "use-a-unique-password",
  "phone": "+91 90000 00000",
  "hospitalId": "<hospital ObjectId from Directory Service GET /api/hospitals>"
}
```

First admin setup is restricted to localhost during local development and is available only until an administrator exists. The server owner may send `ADMIN_SETUP_KEY` in the `x-setup-key` header for remote bootstrap. Never put the key in the request body or client source. Existing email accounts can be assigned admin access during this protected first-admin setup.

The two backend services exchange branch and doctor records through these Clinic Directory Service routes, protected by the shared `SERVICE_API_KEY` in the `x-service-key` header:

- `GET /api/internal/hospitals/:id`
- `GET /api/internal/doctors?hospitalId=...&specialty=...&day=...`
- `GET /api/internal/doctors/:id?hospitalId=...&specialty=...&day=...`
- `POST /api/internal/lookup` with `{ "hospitalIds": [], "doctorIds": [] }`

The browser should call the public directory endpoints directly; do not expose the internal key to the frontend.

Example booking body (`doctorId` may be omitted or set to `any` to select the first available doctor):

```json
{
  "hospitalId": "<hospital ObjectId>",
  "doctorId": "<optional doctor ObjectId or any>",
  "specialty": "Cardiology",
  "appointmentAt": "2026-10-20T10:30:00.000Z",
  "patientName": "A Patient",
  "patientEmail": "patient@example.com",
  "patientPhone": "+91 90000 00000",
  "reason": "Routine consultation"
}
```

The response confirms that the request was stored and routed to the selected hospital. It is a request until hospital staff confirms it.

Emergency alert example:

```json
{
  "patientName": "A Person",
  "patientPhone": "+91 90000 00000",
  "hospitalId": "<branch ObjectId>",
  "situation": "Briefly describe the urgent situation and where help is needed."
}
```

The alert appears in the chosen branch’s CareSlot staff portal, which refreshes the alert queue every 10 seconds. Staff can enable browser notifications. This is not an ambulance dispatch or emergency-call integration; call 112 for immediate danger.
