import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ToastProvider } from "./Toast";

export default function Layout() {
  return (
    <ToastProvider>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-bg">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </ToastProvider>
  );
}

export function HomeRedirect() {
  return <Navigate to="/merge" replace />;
}
