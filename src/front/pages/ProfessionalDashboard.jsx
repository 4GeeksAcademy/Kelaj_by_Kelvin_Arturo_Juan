import { useState } from "react";
import Summary from "../components/ProfessionalPanel/Summary";
import Services from "../components/ProfessionalPanel/Services";
import Reservations from "../components/ProfessionalPanel/Reservations";
import History from "../components/ProfessionalPanel/History";
import Sidebar from "../components/Shared/Sidebar";
import Header from "../components/Shared/Header";
import "../styles/ProfessionalPanel.css";

export default function ProfessionalDashboard() {
  const [activeSection, setActiveSection] = useState("summary");

  const renderSection = () => {
    switch (activeSection) {
      case "summary": return <Summary />;
      case "services": return <Services />;
      case "reservations": return <Reservations />;
      case "history": return <History />;
      default: return <Summary />;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="dashboard-main">
        <Header title="Panel del profesional" />
        <div className="dashboard-content">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
