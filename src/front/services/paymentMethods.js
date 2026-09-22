const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Obtener métodos de pago
export const getPaymentMethods = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BACKEND_URL}/api/payment-methods`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.warn("Error al obtener métodos de pago:", res.status);
    return [];
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    console.warn("Respuesta no es JSON:", contentType);
    return [];
  }

  return await res.json();
};

// Añadir método de pago
export const addPaymentMethod = async (data) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BACKEND_URL}/api/payment-methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.warn("Error al añadir método de pago:", res.status);
    return null;
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    console.warn("Respuesta no es JSON:", contentType);
    return [];
  }
  return await res.json();
};

// Eliminar método de pago
export const deletePaymentMethod = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BACKEND_URL}/api/payment-methods/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.warn("Error al eliminar método de pago:", res.status);
    return false;
  }

  const contentType = res.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return await res.json(); // devuelve { success: true }
  }

  return true; 
};
