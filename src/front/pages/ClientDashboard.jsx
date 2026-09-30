import { useState, useEffect } from "react";
import Summary from "../components/ClientPanel/Summary";
import ClientReservations from "../components/ClientPanel/ClientReservations";
import ClientFavorites from "../components/ClientPanel/ClientFavorites";
import { ClientSidebar } from "../components/Shared/Sidebar"; 
import "../styles/ProfesionalPanel.css"; 

export default function ClientDashboard() {
  const [activeSection, setActiveSection] = useState("summary");
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    const fetchClientDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/client/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setClientData(result);
        }
      } catch (error) {
        console.error("Error al cargar el dashboard del cliente:", error);
      }
    };

    fetchClientDashboard();
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case "summary": return <Summary data={clientData} setActiveSection={setActiveSection} />;
      case "reservations": return <ClientReservations data={clientData} />;
      case "favorites": return <ClientFavorites data={clientData} />;
      default: return <Summary data={clientData} setActiveSection={setActiveSection} />;
    }
  };

  return (
    <div className="dashboard-container">
      <ClientSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        clientData={clientData}
      />
      <div className="dashboard-main-content">
        {renderSection()}
      </div>
    </div>
  );
}