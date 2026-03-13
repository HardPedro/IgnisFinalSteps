import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userData: any | null;
  isAuthReady: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Fetch user data
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            // Check if there's a pre-created user document with this email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', user.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
              // Link this UID to the existing user document
              const existingDoc = querySnapshot.docs[0];
              const existingData = existingDoc.data();
              
              // Create the document with the actual UID
              await setDoc(doc(db, 'users', user.uid), {
                ...existingData,
                name: user.displayName || existingData.name,
                updatedAt: new Date().toISOString()
              });
              
              // Delete the temporary document
              await deleteDoc(doc(db, 'users', existingDoc.id));
              
              setUserData(existingData);
            } else {
              // New user, create tenant and user profile
              const tenantId = 't-' + Date.now();
              await setDoc(doc(db, 'tenants', tenantId), {
                name: user.displayName || 'Minha Oficina',
                plan: 'CORE',
                createdAt: new Date().toISOString()
              });
              
              const newUserData = {
                tenantId,
                email: user.email,
                name: user.displayName,
                role: 'Gestor',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, 'users', user.uid), newUserData);
              setUserData(newUserData);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, isAuthReady, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
