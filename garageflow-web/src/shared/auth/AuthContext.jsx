import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { fetchCurrentUserRequest, logoutRequest } from '../../api/auth';
import { fetchCurrentGarageRequest } from '../../api/garages';
import { updateUserProfileRequest } from '../../api/users';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}


export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [currentGarage, setCurrentGarage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasToken = Boolean(localStorage.getItem('token'));
  const isAuthenticated = Boolean(user && hasToken);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const login = (nextUser, tokens = {}) => {
    if (tokens.access) {
      localStorage.setItem('token', tokens.access);
    }
    if (tokens.refresh) {
      localStorage.setItem('refresh', tokens.refresh);
    }
    persistUser(nextUser);
    setError(null);
  };

  const logout = () => {
    logoutRequest().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    persistUser(null);
    setCurrentGarage(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await fetchCurrentUserRequest();
      persistUser(profile);
      return profile;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
      }
      setError(requestError.response?.data || 'Impossible de recuperer les informations utilisateur.');
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentGarage = async () => {
    try {
      setLoading(true);
      setError(null);
      const garage = await fetchCurrentGarageRequest();
      setCurrentGarage(garage);
      return garage;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
      }
      setCurrentGarage(null);
      setError(requestError.response?.data || 'Impossible de recuperer les informations du garage.');
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await updateUserProfileRequest(payload);
      persistUser(updatedUser);
      return updatedUser;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
      }
      setError(requestError.response?.data || 'Impossible de mettre a jour votre profil.');
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasToken && !user) {
      refreshUser().catch(() => {});
    }
  }, [hasToken, user]);

  const value = useMemo(
    () => ({
      user,
      currentGarage,
      isAuthenticated,
      loading,
      error,
      login,
      logout,
      refreshUser,
      refreshCurrentGarage,
      updateUser,
      setError,
    }),
    [user, currentGarage, isAuthenticated, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider.");
  }
  return context;
}
