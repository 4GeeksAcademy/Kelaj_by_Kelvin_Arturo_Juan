export const initialStore = () => {
  return {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null
  }
}

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case 'set_hello':
      return {
        ...store,
        message: action.payload
      };

    case 'add_task':

      const { id, color } = action.payload

      return {
        ...store,
        todos: store.todos.map((todo) => (todo.id === id ? { ...todo, background: color } : todo))
      };

    case 'set_user':
      return {
        ...store,
        user: action.payload.user,
        token: action.payload.token
      };

    case 'logout':
      return {
        ...store,
        user: null,
        token: null
      };

    default:
      throw Error('Unknown action.');
  }
}