"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { userService } from "@/services/userService";
import { AppUser } from "@/types/user";

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (firebaseUser: User) => {
    let dbUser = await userService.getUser(firebaseUser.uid);
    if (dbUser && !dbUser.photoUrl && firebaseUser.photoURL) {
      dbUser = { ...dbUser, photoUrl: firebaseUser.photoURL, photoURL: firebaseUser.photoURL };
    }
    setAppUser(dbUser);
  };

  const refreshUser = async () => {
    if (auth?.currentUser) {
      await fetchAppUser(auth.currentUser);
    }
  };

  useEffect(() => {
    // Check if Firebase is actually initialized (prevents error when env vars are missing)
    if (!auth || Object.keys(auth).length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchAppUser(firebaseUser);
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
