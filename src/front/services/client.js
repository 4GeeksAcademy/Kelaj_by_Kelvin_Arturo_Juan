const API_URL = import.meta.env.VITE_BACKEND_URL;

export const getClientDashboardData = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/api/client/dashboard`, {
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
    });
    if (!res.ok) throw new Error("Error al obtener los datos del panel de cliente");
    return await res.json();
  } catch (error) {
    console.error("Error en getClientDashboardData:", error);
    return null;
  }
};