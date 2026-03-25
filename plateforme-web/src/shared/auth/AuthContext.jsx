import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  fetchCurrentOrganizationRequest,
  fetchCurrentUserRequest,
  logoutRequest,
  updateUserProfileRequest,
} from '../api';

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
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasToken = Boolean(localStorage.getItem('token'));
  const isAuthenticated = Boolean(user && hasToken);

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const login = useCallback((nextUser, tokens = {}) => {
    if (tokens.access) {
      localStorage.setItem('token', tokens.access);
    }
    if (tokens.refresh) {
      localStorage.setItem('refresh', tokens.refresh);
    }
    persistUser(nextUser);
    setError(null);
  }, [persistUser]);

  const logout = useCallback(() => {
    const accessToken = localStorage.getItem('token');
    if (accessToken) {
      logoutRequest().catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    persistUser(null);
    setCurrentOrganization(null);
    setError(null);
  }, [persistUser]);

  const refreshUser = useCallback(async () => {
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
  }, [logout, persistUser]);

  const refreshCurrentOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const org = await fetchCurrentOrganizationRequest();
      setCurrentOrganization(org);
      return org;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
      }
      setCurrentOrganization(null);
      setError(requestError.response?.data || "Impossible de recuperer les informations de l'organisation.");
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const updateUser = useCallback(async (payload) => {
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
  }, [logout, persistUser]);

  useEffect(() => {
    if (hasToken && !user) {
      refreshUser().catch(() => {});
    }
  }, [hasToken, user, refreshUser]);

  const value = useMemo(
    () => ({
      user,
      currentOrganization,
      isAuthenticated,
      loading,
      error,
      login,
      logout,
      refreshUser,
      refreshCurrentOrganization,
      updateUser,
      setError,
    }),
    [user, currentOrganization, isAuthenticated, loading, error, login, logout, refreshUser, refreshCurrentOrganization, updateUser]
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
