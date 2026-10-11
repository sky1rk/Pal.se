import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import "./index.css";
import { AuthProvider } from "./auth/AuthContext.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AppShell from "./layouts/AppShell.tsx";
import App from "./App.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import Patients from "./pages/Patients.tsx";
import Reports from "./pages/Reports.tsx";
import Signup from "./pages/Signup.tsx";

const root = document.getElementById("root")!;
if (!root) {
  throw Error("Root element cannot be found or does not exist.");
}

const router = createBrowserRouter([
  { path: "/login", Component: Login },
  { path: "/signup", Component: Signup },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: AppShell,
        children: [
          { path: "/", Component: App },
          { path: "/dashboard", Component: Dashboard },
          { path: "/patients", Component: Patients },
          { path: "/reports", Component: Reports },
        ],
      },
    ],
  },
  { path: "*", Component: NotFound },
]);

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
