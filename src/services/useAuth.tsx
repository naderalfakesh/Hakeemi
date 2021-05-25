import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';

const getErrorMessage = (text: string) => text.substr(text.indexOf(' ') + 1);

const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(
    null,
  );

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const register = async (name: string, email: string, password: string) => {
    try {
      await auth().createUserWithEmailAndPassword(email, password);
      await auth().currentUser?.updateProfile({ displayName: name });
    } catch (error) {
      throw getErrorMessage(error.message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      throw getErrorMessage(error.message);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      throw getErrorMessage(error.message);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      throw getErrorMessage(error.message);
    }
  };

  return { login, logout, register, currentUser, forgotPassword };
};

export default useAuth;
