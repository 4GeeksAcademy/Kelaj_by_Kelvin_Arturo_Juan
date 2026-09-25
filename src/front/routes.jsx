import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Privacy } from "./pages/Privacy";
import { Register } from "./pages/Register";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import Checkout from "./pages/Checkout";
import { BecomeProvider } from "./pages/BecomeProvider";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import { Settings } from "./pages/Settings";
import { ProvidersCatalog } from "./pages/ProvidersCatalog";
import { Results } from "./pages/Results";
import { AdminFeatured } from "./pages/AdminFeatured";
import { Providers } from "./pages/Providers";
import { VerificationPage } from "./pages/VerificationPage";

const RequireAuth = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/catalog" element={<ProvidersCatalog />} />
      <Route path="/profile/:theId" element={<Profile />} />
      <Route path="/single/:theId" element={<Single />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route element={<RequireAuth />}>
        <Route path="/become-provider" element={<BecomeProvider />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/professional-panel" element={<ProfessionalDashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

        <Route path="/results" element={<Results />} />
        <Route path="/admin/featured" element={<AdminFeatured />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/verificacion" element={<VerificationPage />} />

    </Route>
  )
);