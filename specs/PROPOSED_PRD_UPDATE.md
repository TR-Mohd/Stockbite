# PROPOSED PRD UPDATE: Features Beyond MVP

This document formally defines features that were discovered during the audit of the `feature/mohammed-manager-bi` branch that go beyond the original PRD scope. 

## Audit Findings: Extra Features

| Feature Description | File Locations | Alignment with Business Objectives |
| :--- | :--- | :--- |
| **Employee "Last Active" Tracking** <br/> Dynamically calculates an employee's last active timestamp by combining their most recent transaction time and audit log entry. | `app/routers/manager.py` | **Aligned.** Provides managers with better visibility into staff activity and attendance, supporting data-driven staffing decisions. |
| **Structured ID Generation (Staff & Suppliers)** <br/> Implements complex auto-generation of IDs. Employee IDs use the format `EMP-<ROLE>-<YY><SEQ>` and Supplier IDs use `SUP-<HUB>-<YY><SEQ>`. | `frontend/src/utils/idGenerator.js`, `app/schemas.py` | **Aligned.** Allows the restaurant to have human-readable, context-aware tracking IDs, streamlining supply chain and staff management. |
| **Super-Admin "Fire Employee" Protection** <br/> Hardcodes a strict authorization check on both frontend and backend that exclusively allows the "mohammed" account to view the "Delete Employee" UI (Trash Icon) and execute permanent deletions. | `frontend/src/features/manager/StaffManagement.jsx`, `app/routers/manager.py` | **Aligned (with adjustments).** Enforces secure access control. *Note: The hardcoded username should eventually be replaced with a formal `SuperAdmin` role.* |
| **Supplier Geography (Coverage & Logistics Hub)** <br/> Introduces a "Coverage" attribute (Regional vs. National) and a "Logistics Hub" (Region) dropdown for Suppliers, restricting hub selection to 'NAT' if "National" coverage is chosen. | `frontend/src/features/manager/SupplierModal.jsx`, `frontend/src/features/manager/SupplierDirectory.jsx`, `frontend/src/constants/regions.js` | **Aligned.** Provides necessary geographical context for supply chain operations, especially useful for tracking national vs. local vendors. |
| **Live Conditional Phone Number Formatting** <br/> Automatically formats phone numbers differently based on context (e.g., landline `+62 xx xxxx-xxxx` for companies vs. mobile `+62 8xx-xxxx-xxxx` if a contact person is provided). | `frontend/src/utils/formatters.js`, `frontend/src/features/manager/SupplierModal.jsx` | **Aligned.** Improves UI/UX and standardizes data entry across the system, ensuring clean CRM and Supplier records. |
| **Strict Live Email Validation** <br/> Implements robust custom logic checking for `@` symbols, usernames, domain dots, and valid domain extensions, providing real-time specific error feedback during input. | `frontend/src/features/manager/SupplierModal.jsx` | **Aligned.** Prevents invalid data entry, ensuring communication features (like sending POs or receipts) function correctly. |
| **Soft Delete & Login Revocation** <br/> Enforces a data integrity protocol to prevent hard deletion of staff with transactions, alongside an authentication constraint that blocks inactive accounts at login. | `app/routers/manager.py`, `app/auth.py`, `frontend/src/features/manager/StaffManagement.jsx` | **Aligned.** Ensures financial records remain intact (no foreign key violations) while strictly revoking access for fired employees. |

---

## Proposed New Functional Requirements (F-IDs)

The following requirements should be formally appended to the `specs/project-brief.md` document under the Manager (BI & Administration) section:

### 5.3 FR Table : Manager (BI & Administration) - Additions

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-029** | Manager | Display an accurate "Last Active" timestamp for each employee in the User Management list by aggregating their latest POS transaction or login event. | When the manager views the Staff list in the User Management module. | Medium | S |
| **F-030** | System | Automatically generate structured IDs for new employees (`EMP-<ROLE>-<YY><SEQ>`) and suppliers (`SUP-<HUB>-<YY><SEQ>`) instead of default UUIDs. | When adding a new user or supplier via the management modals. | High | S |
| **F-031** | System | Restrict the permanent deletion ("Firing") of User accounts exclusively to a predefined Super-Admin or Founder account, blocking standard Managers. | When a deletion request is sent or the Staff Management UI is rendered. | High | M |
| **F-032** | Manager | Assign a "Coverage" type (Regional/National) and a "Logistics Hub" region to suppliers to track geographical supply chain distribution. | When creating or editing a supplier record in the Supplier Directory. | Medium | S |
| **F-033** | System | Apply live conditional formatting to phone numbers and perform strict validation on email addresses during data entry. | When a user types in phone or email fields in CRM or Supplier modals. | Medium | S |
| **F-034** | System | **Data Integrity Protocol:** To preserve financial accuracy and prevent PostgreSQL foreign key violations, Staff accounts with associated POS transaction histories cannot be hard-deleted. The backend enforces a 'Soft Delete' (Deactivation) workflow via HTTP 400 rejection on deletion attempts. | When a deletion request is sent for an employee with transaction history. | High | M |

### 6.4 NFR Table : Manager (BI & Security) - Additions

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NFR-019** | System | **Security Protocol:** The authentication service explicitly verifies the 'is_active' status flag during the login sequence. Deactivated staff members are instantly intercepted and rejected with an HTTP 401. | Every time a user attempts to log in. | Critical | M |
