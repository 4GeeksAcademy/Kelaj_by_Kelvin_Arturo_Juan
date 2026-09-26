import { useState, useEffect } from "react";
import { ClientSidebar } from "../components/Shared/Sidebar"; 
import ClientSummary from "../components/ClientPanel/Summary";
import ClientReservations from "../components/ClientPanel/ClientReservations";
import ClientFavorites from "../components/ClientPanel/ClientFavorites";
import { getClientDashboardData } from "../services/client";
import "../styles/ProfesionalPanel.css"; 

export default function ClientDashboard() {
  const [activeSection, setActiveSection] = useState("summary");
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    getClientDashboardData().then(data => {
      if (data) setClientData(data);
    });
  }, []);

  return (
    <div className="dashboard-container">
      <ClientSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        clientData={clientData} 
      />
      
      <main className="dashboard-main-content">
        {activeSection === "summary" && (
          <ClientSummary data={clientData} setActiveSection={setActiveSection} />
        )}
        {activeSection === "reservations" && (
          <ClientReservations reservations={clientData?.upcoming_reservations || []} />
        )}
        {activeSection === "favorites" && (
          <ClientFavorites favorites={clientData?.following_professionals || []} />
        )}
      </main>
    </div>
  );
}