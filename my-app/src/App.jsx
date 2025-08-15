import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Planner Pages
import Dashboard from "./pages/planner/Dashboard";
import EventEditor from "./pages/planner/EventEditor";
import FloorplanEditor from "./pages/planner/FloorplanEditor";
import VendorMarketplace from "./pages/planner/VendorMarketplace";
import GuestListManager from "./pages/planner/GuestListManager";
import RSVPTracker from "./pages/planner/RSVPTracker";
import AgendaManager from "./pages/planner/AgendaManager";
import ReportsFeedback from "./pages/planner/ReportsFeedback";

// Vendor Pages
import VendorProfile from "./pages/vendor/VendorProfile";
import VendorBookings from "./pages/vendor/VendorBookings";
import VendorFloorplan from "./pages/vendor/VendorFloorplan";
import VendorReviews from "./pages/vendor/VendorReviews";
import VendorContracts from "./pages/vendor/VendorContracts";

// Admin Pages
import AdminVerification from "./pages/admin/AdminVerification";
import AdminVendorDetails from "./pages/admin/AdminVendorDetails";
import AdminReports from "./pages/admin/AdminReports";
import AdminUserManagement from "./pages/admin/AdminUserManagement";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    { path: "/", element: <Index /> },

    // Planner Routes
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/events", element: <EventEditor /> },
    { path: "/floorplan", element: <FloorplanEditor /> },
    { path: "/vendors", element: <VendorMarketplace /> },
    { path: "/guests", element: <GuestListManager /> },
    { path: "/rsvp", element: <RSVPTracker /> },
    { path: "/agenda", element: <AgendaManager /> },
    { path: "/reports", element: <ReportsFeedback /> },

    // Vendor Routes
    { path: "/vendor/profile", element: <VendorProfile /> },
    { path: "/vendor/bookings", element: <VendorBookings /> },
    { path: "/vendor/floorplan", element: <VendorFloorplan /> },
    { path: "/vendor/reviews", element: <VendorReviews /> },
    { path: "/vendor/contracts", element: <VendorContracts /> },

    // Admin Routes
    { path: "/admin/verification", element: <AdminVerification /> },
    { path: "/admin/vendors", element: <AdminVendorDetails /> },
    { path: "/admin/reports", element: <AdminReports /> },
    { path: "/admin/users", element: <AdminUserManagement /> },

    // Catch-all
    { path: "*", element: <NotFound /> },
  ],
  {
    future: { v7_relativeSplatPath: true }, // ⚡ Enable the v7 future flag
    v7_startTransition: true,
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
