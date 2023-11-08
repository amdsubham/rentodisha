
import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '../context/UserContext';
import { LinearGradient } from 'expo-linear-gradient';

const AuthContext = createContext({
})

const AuthProvider = ({ children }) => {
  const { setUserInfoToStore } = useUser();
  const [user, setUser] = useState(null);
  const [loadingLogin, setLoadingLogin] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
        setLoadingLogin(false);
      } else {
        // setUser(null);
        setLoadingLogin(false);
      }
    });

    return () => {
      // Unsubscribe from the auth state listener when the component unmounts
      unsubscribe();
    };
  }, []);

  const signInWithEmailPassword = (email, password) => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const uid = userCredential.user.uid;
        setUserInfoToStore({ firebaseId: uid })

      })
      .catch((error) => {
        console.log("Firebase SignIn Error", error)
      });
  };

  const signUpWithEmailPassword = async (email, password) => {
    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const uid = userCredential.user.uid;
        setUserInfoToStore({ firebaseId: uid })
      })
      .catch((error) => {
        console.log("Firebase SignUp Error", error)
      });
  };

  const logOut = async () => {
    setLoadingLogin(true);
    await signOut(auth);
    setLoadingLogin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithEmailPassword,
        signUpWithEmailPassword,
        loadingLogin,
        logOut,
      }}
    >
      {loadingLogin ?
        <LinearGradient colors={['#007DBC', '#005AAA']}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            height: "100%",
            width: "100%"
          }}>
          <ActivityIndicator size="large" color="white" />
        </LinearGradient>
        : children}
    </AuthContext.Provider>
  );
};
const AuthOpen = () => {
  return useContext(AuthContext);
};

export { AuthOpen, AuthProvider };