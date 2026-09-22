import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
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

export const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >
        <Route path= "/" element={<Home />} />
        <Route path= "/catalog" element={<ProvidersCatalog />} />
        <Route path= "/settings" element={<Settings />} />
        <Route path="/profile/:theId" element={<Profile />} />
        <Route path="/profile/:theId/become-provider" element={<BecomeProvider />} />
        <Route path="/single/:theId" element={ <Single />} />  
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/register" element={<Register />} />
        <Route path="/professional-panel" element={<ProfessionalDashboard />} />
        <Route path="/login" element={<Login />} />
      </Route>
    )
);