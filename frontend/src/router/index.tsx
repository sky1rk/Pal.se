import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";
import Dashboard from "../pages/Dashboard";
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
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/monitor",
        element: <Monitor />,
      },
      {
        path: "/patients",
        element: <Patients />,
      },
      {
        path: "/profile/:user_id",
        element: <Profile />,
      },
      {
        path: "/reports",
        element: <Reports />,
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
