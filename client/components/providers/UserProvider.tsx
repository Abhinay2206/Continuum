'use client';

import { createContext, useContext } from 'react';

type UserContextType = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
  githubConnected: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  user,
  workspace,
  githubConnected,
}: {
  children: React.ReactNode;
  user: UserContextType['user'];
  workspace: UserContextType['workspace'];
  githubConnected: boolean;
}) {
  return (
    <UserContext.Provider value={{ user, workspace, githubConnected }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
