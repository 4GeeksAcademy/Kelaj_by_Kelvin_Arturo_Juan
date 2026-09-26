import { useState, useEffect } from "react";
import Summary from "../components/ProfessionalPanel/Summary";
import Services from "../components/ProfessionalPanel/Services";
import Reservations from "../components/ProfessionalPanel/Reservations";
import History from "../components/ProfessionalPanel/History";
import Sidebar from "../components/Shared/Sidebar";
import { getFullProviderProfile } from "../services/professional";
import "../styles/ProfesionalPanel.css";

export default function ProfessionalDashboard() {
  const [activeSection, setActiveSection] = useState("summary");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(
      sessionStorage.getItem("user") || localStorage.getItem("user") || "null"
    );

    if (!storedUser || !storedUser.id) return;

    getFullProviderProfile(storedUser.id).then((data) => {
      if (data) setProfile(data);
    });
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "summary": return <Summary setActiveSection={setActiveSection} />;
      case "services": return <Services />;
      case "reservations": return <Reservations />;
      case "history": return <History />;
      default: return <Summary setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        profile={profile}
      />
      <div className="dashboard-main-content">
        {renderSection()}
      </div>
    </div>
  );
}