const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// RESUMEN
export const getProviderSummary = async () => {
  const res = await fetch(`${BACKEND_URL}/api/provider/summary`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return await res.json();
};

// SERVICIOS
export const getProviderServices = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/provider/services`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!response.ok) throw new Error("Error al obtener servicios");
  return await response.json();
};

export const toggleServiceStatus = async (id) => {
  const res = await fetch(`${BACKEND_URL}/api/provider/services/${id}/toggle`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return await res.json();
};

// RESERVAS
export const getProviderAppointments = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/provider/appointments`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    return [];
  }
};

// HISTORIAL
export const getProviderTransactions = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/provider/transactions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return [];
  }
};

// PERFIL
export const getFullProviderProfile = async (userId) => {
  const token = localStorage.getItem("token");
  const url = `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(
        `Respuesta no-JSON desde ${url}. ¿VITE_BACKEND_URL está bien configurada?`,
        text.slice(0, 200)
      );
      return null;
    }

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Error al obtener el perfil completo:", errorData);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error en getFullProviderProfile:", error);
    return null;
  }
};