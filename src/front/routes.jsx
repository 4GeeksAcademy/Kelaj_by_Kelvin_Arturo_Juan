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
import { Results } from "./pages/Results";
import { AdminFeatured } from "./pages/AdminFeatured";
import { Providers } from "./pages/Providers";
import { VerificationPage } from "./pages/VerificationPage";
import { Search } from "./pages/Search"; 
import { BecomeProvider } from "./pages/BecomeProvider";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";

export const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >
        <Route path= "/" element={<Home />} />
        <Route path="/single/:theId" element={ <Single />} />  {/* Dynamic route for single items */}
        <Route path="/search" element={<Search />} /> 
        <Route path="/profile/:theId" element={<Profile />} />
        <Route path="/profile/:theId/become-provider" element={<BecomeProvider />} />
        <Route path="/single/:theId" element={ <Single />} />  
        <Route path="/checkout" element={<Checkout serviceId={4}/>} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/register" element={<Register />} />
        <Route path="/professional-panel" element={<ProfessionalDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/results" element={<Results />} />
        <Route path="/admin/featured" element={<AdminFeatured />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/verificacion" element={<VerificationPage />} />
      </Route>
    )
);