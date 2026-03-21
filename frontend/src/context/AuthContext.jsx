import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const initialState = { user: null, token: null };

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload.user, token: action.payload.token };
    case 'LOGOUT':
      return { user: null, token: null };
    default:
      return state;
  }
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(decoded) {
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('dockmaster_token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && !isTokenExpired(decoded)) {
        dispatch({
          type: 'LOGIN',
          payload: {
            token,
            user: { id: decoded.id, username: decoded.username, role: decoded.role },
          },
        });
      } else {
        localStorage.removeItem('dockmaster_token');
      }
    }
  }, []);

  async function login(username, password) {
    const response = await axios.post('http://localhost:4000/api/auth/login', { username, password });
    const { token, user } = response.data;
    localStorage.setItem('dockmaster_token', token);
    dispatch({ type: 'LOGIN', payload: { token, user } });
  }

  function logout() {
    const token = localStorage.getItem('dockmaster_token');
    if (token) {
      axios.post('http://localhost:4000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('dockmaster_token');
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
