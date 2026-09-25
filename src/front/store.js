export const initialStore = () => {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  let user = null;

  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error("Error al leer el usuario del localStorage:", error);
      localStorage.removeItem("user");
      user = null;
    }
  }

  return {
    user,
    token: storedToken || null
  };
};

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "set_user":
      return {
        ...store,
        user: action.payload.user,
        token: action.payload.token,
      };

    case "logout":
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      return {
        ...store,
        user: null,
        token: null,
      };

    default:
      console.warn(`Acción desconocida en el reducer: ${action.type}`);
      return store;
      }
}
