import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";
import AppShellLayout from "../layouts/AppShellLayout";
import Dashboard from "../pages/Dashboard";
import EditRecord from "../pages/EditRecord";
import Login from "../pages/Login";
import Monitor from "../pages/Monitor";
import Patients from "../pages/Patients";
import Profile from "../pages/Profile";
import Reports from "../pages/Reports";
import Signup from "../pages/Signup";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          {
            path: "/",
            element: <Dashboard />,
          },
          {
            path: "/monitor",
            element: <Monitor />,
          },
          {
            path: "/edit-record",
            element: <EditRecord />,
          },
          {
            path: "/patients",
            element: <Patients />,
          },
          {
            path: "/reports",
            element: <Reports />,
          },
        ],
      },
      {
        path: "/profile/:user_id",
        element: <Profile />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);
