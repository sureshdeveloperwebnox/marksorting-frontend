---
name: marksorting-mobile-api
description: Integration specs and API contracts for Flutter mobile client (Service Engineer & Technician app), covering Bearer JWT authentication, presigned S3 image uploads, Ticket management, Service Reports, Installation Reports, and Expenses.
---

# MarkSorting Mobile API & Flutter Integration Specs

## 1. Authentication & Session Strategy

The Flutter mobile application is designed specifically for **Service Engineers** and **Technicians** in the field.

### Base Configuration
- **Base URL**: `http://<server-ip>:4000/api/v1`
- **Authentication**: Bearer JWT passed in HTTP headers: `Authorization: Bearer <access_token>`
- **Token Vault**: Store tokens in native secure storage (`flutter_secure_storage`).

### Authentication Flow
1. `POST /auth/login`
   - Request Body: `{ "email": "engineer@marksorting.com", "password": "..." }`
   - Response: `{ "user": { ... }, "access_token": "...", "refresh_token": "..." }`
2. `POST /auth/refresh`
   - Request Header: `Authorization: Bearer <refresh_token>` or `{ "refresh_token": "..." }`
   - Response: `{ "access_token": "...", "refresh_token": "..." }`

---

## 2. Field Upload Protocol (AWS S3 Presigned Image Uploads)

Mobile field engineers upload photos for receipts, machine installations, damaged components, and customer signatures.

### Binary Stream Upload Steps
1. Request presigned upload URL:
   `POST /upload/presigned-url`
   Body: `{ "file_name": "installation_sign.png", "file_type": "image/png", "folder": "signatures" }`
   Response: `{ "upload_url": "https://s3.amazonaws.com/...", "file_key": "signatures/uuid-sign.png" }`

2. Direct Binary PUT from Mobile:
   Execute HTTP `PUT` request directly to `upload_url` with binary file stream:
   - Header: `Content-Type: image/png`
   - Body: Raw image bytes

3. Send Object Key in Form Payload:
   Use `file_key` in creation/update DTOs (e.g. `customer_signature_key: "signatures/uuid-sign.png"`).

---

## 3. Mobile Module Endpoints & Payload Contracts

### A. Ticket Management Workflow
- `GET /tickets/engineer` — List tickets assigned to the logged-in engineer.
  - Query params: `page`, `limit`, `status` (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `PENDING_PARTS`).
- `GET /tickets/:id` — Fetch detailed ticket information, customer contact, machine mill location.
- `PATCH /tickets/:id/status` — Update ticket status.
  - Body: `{ "status": "IN_PROGRESS", "notes": "On-site investigation started" }`
- `POST /tickets/:id/timeline` — Add progress timeline entry with optional image keys.

### B. Service Report Workflow
- `POST /service-reports` — Submit complete service report for a mill machine visit.
  - Payload:
    ```json
    {
      "mill_id": "uuid",
      "ticket_id": "uuid",
      "visit_date": "2026-08-11",
      "service_type": "PREVENTIVE",
      "compressor_details": { "pressure": "8.5 bar", "oil_level": "GOOD" },
      "air_dryer_details": { "temperature": "3°C", "filter_status": "CLEAN" },
      "engineer_signature_key": "signatures/uuid-eng.png",
      "customer_signature_key": "signatures/uuid-cust.png",
      "remarks": "Machine serviced and tested successfully."
    }
    ```
- `GET /service-reports/my-reports` — View engineer's submitted service reports.
- `GET /service-reports/:id/pdf` — Retrieve vector PDF download link.

### C. Installation Report Workflow
- `POST /installation-reports` — Create machine installation certificate upon mill commissioning.
  - Payload includes machine model, serial numbers, ground resistance values, warranty start date, and customer sign-off signature keys.

### D. Expense Filing & Receipt Upload Workflow
- `GET /expense-categories` — Fetch available expense categories (`TRAVEL`, `LODGING`, `FOOD`, `SPARE_PARTS`, `MISC`).
- `POST /expenses` — Submit expense claim with receipt photo.
  - Body:
    ```json
    {
      "mill_id": "uuid",
      "category_id": "uuid",
      "amount": 450.00,
      "expense_date": "2026-08-11",
      "description": "Hotel lodging during mill installation",
      "receipt_image_key": "expenses/uuid-receipt.jpg"
    }
    ```
- `GET /expenses/my-expenses` — View filed expenses and approval status (`PENDING`, `APPROVED`, `REJECTED`, `REIMBURSED`).

### E. Lookup / Reference Data APIs
- `GET /customers` — List active customers.
- `GET /mills` — List mill processing facilities with address and contact details.
- `GET /technicians` — List technician roster for co-assignment.

### F. Store Return & Material-Level Acknowledge Workflow
Service engineers manage parts return and technician acknowledgements per material unit:

1. **Fetch Assigned Returns**:
   - `GET /stores/return?status=Pending&page=1&limit=10`
   - Returns store records assigned to the logged-in engineer.

2. **Submit Store Return Details**:
   - `PUT /stores/return/:id/details` (or `PUT /stores/return/:id`)
   - **Business Rules**:
     - If `used: true`: Both `return_status` (`"Returned"` | `"Not Returned"`) and `acknowledge_status` (`"Acknowledged"` | `"Pending"`) are **required**.
     - If `used: false`: Represents an **Unused New Product** return. `return_status` and `acknowledge_status` are omitted.
   - **Request Payload**:
     ```json
     {
       "provider_name": "ST Courier",
       "invoice_number": "TRK-987654321",
       "return_status": "In Progress",
       "courier_photos": ["https://storage.example.com/uploads/receipt.jpg"],
       "products": [
         {
           "material_name": "MAIN BOARD TT",
           "barcodes": [
             {
               "barcode": "95683703",
               "used": true,
               "return_status": "Returned",
               "acknowledge_status": "Acknowledged"
             },
             {
               "barcode": "95683704",
               "used": false
             }
           ]
         }
       ]
     }
     ```
   - **Response**: Returns updated store record with automatic `quantity_summary` breakdown.

---

## 4. Mobile Offline & Resilience Guidelines

1. **Local Storage**: Cache lookup data (customers, mills, expense categories) in local SQLite or Hive storage for offline form completion.
2. **Retry Interceptor**: Configure Dio interceptors to queue failed submissions when mobile connectivity is intermittent in remote mill regions.
3. **Status Enums**: Map backend status values strictly using typed Dart Enums (`TicketStatus`, `ExpenseStatus`, `ServiceType`, `ReturnStatus`).
