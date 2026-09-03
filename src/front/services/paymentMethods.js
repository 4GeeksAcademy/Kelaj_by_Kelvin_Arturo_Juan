const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getPaymentMethods = async () => {
  const res = await fetch(`${BACKEND_URL}/payment-methods`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return await res.json();
};

export const addPaymentMethod = async (data) => {
  const res = await fetch(`${BACKEND_URL}/payment-methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data)
  });
  return await res.json();
};

export const deletePaymentMethod = async (id) => {
  await fetch(`${BACKEND_URL}/payment-methods/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
};
