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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Firebase is actually initialized (prevents error when env vars are missing)
    if (!auth || Object.keys(auth).length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch corresponding app user from Firestore
        let dbUser = await userService.getUser(firebaseUser.uid);
        
        // Merge photoURL from Auth if missing in DB (common when updated from Android app)
        if (dbUser && !dbUser.photoUrl && firebaseUser.photoURL) {
          dbUser = { ...dbUser, photoUrl: firebaseUser.photoURL, photoURL: firebaseUser.photoURL };
        }
        
        setAppUser(dbUser);
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
