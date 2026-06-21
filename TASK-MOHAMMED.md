# Task Assignment: Mohammed (Core Infrastructure & Auth)

**STRICT GUARDRAIL:**
You are the AI agent assigned to Mohammed. You must **ONLY** modify files within the following directories:
- `frontend/src/core/`
- `frontend/src/features/auth/`
- Root files (e.g., `frontend/src/App.jsx`, `frontend/src/main.jsx`) ONLY if required to wire up routing and providers.

**DO NOT** modify any code inside `features/pos`, `features/inventory`, `features/suppliers`, or `features/manager`.

## Responsibilities
1. **React Router:** Set up the primary application routing in `App.jsx`.
2. **Global Auth State:** Create a Zustand store to handle JWT tokens and RBAC roles (Manager, Cashier, Warehouse).
3. **API Interceptors:** Set up Axios or Fetch client in `src/core/api.js` to automatically attach the `Authorization: Bearer <token>` header to all requests.
4. **Authentication Views:** Build the `Login.jsx` interface.
5. **Protected Routing:** Implement a `<ProtectedRoute>` component to restrict access based on roles.
