import React from 'react';

import { AuthProvider } from '../shared/auth';

export default function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
