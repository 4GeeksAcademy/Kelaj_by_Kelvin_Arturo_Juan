export const initialStore = () => {
  let savedUser = null
  let savedToken = localStorage.getItem("token") || null
  try {
    savedUser = JSON.parse(localStorage.getItem("user") || "null")
  } catch (e) {
    savedUser = null
  }
  return {
    message: null,
    todos: [
      {
        id: 1,
        title: "Make the bed",
        background: null,
      },
      {
        id: 2,
        title: "Do my homework",
        background: null,
      }
    ],
    user: savedUser,
    token: savedToken
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