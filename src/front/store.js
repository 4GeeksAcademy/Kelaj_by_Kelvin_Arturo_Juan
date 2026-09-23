export const initialStore = () => {
  return {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
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
