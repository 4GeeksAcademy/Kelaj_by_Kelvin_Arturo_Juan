const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// RESUMEN
export const getProviderSummary = async () => {
  const res = await fetch(`${BACKEND_URL}/provider/summary`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return await res.json();
};

// SERVICIOS
export const getProviderServices = async () => {
  const res = await fetch(`${BACKEND_URL}/provider/services`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return await res.json();
};

export const toggleServiceStatus = async (id) => {
  const res = await fetch(`${BACKEND_URL}/provider/services/${id}/toggle`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return await res.json();
};

// RESERVAS
export const getProviderAppointments = async () => {
  const res = await fetch(`${BACKEND_URL}/provider/appointments`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return await res.json();
};

// HISTORIAL
export const getProviderTransactions = async () => {
  const res = await fetch(`${BACKEND_URL}/provider/transactions`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return await res.json();
};
