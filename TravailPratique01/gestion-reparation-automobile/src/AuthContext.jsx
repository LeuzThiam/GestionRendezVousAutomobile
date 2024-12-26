// AuthContext.jsx
import React, { createContext, useState } from 'react';

// Créez le contexte
export const AuthContext = createContext();

// Créez le fournisseur du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user contiendra les informations de l'utilisateur connecté

  const login = (userData) => {
    setUser(userData);
    // Vous pouvez également stocker les informations dans localStorage si nécessaire
  };

  const logout = () => {
    setUser(null);
    // Supprimez également les données du localStorage si vous les avez stockées
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
