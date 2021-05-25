import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';

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
      console.error(error);
    }
  };

  const login = (email: string, password: string) => {
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => console.log('User signed in!'))
      .catch(console.log);
  };

  const logout = () => {
    auth()
      .signOut()
      .then(() => {
        setCurrentUser(null);
        console.log('User signed off');
      })
      .catch(console.log);
  };

  const forgotPassword = (email: string) => {
    return auth().sendPasswordResetEmail(email);
  };

  return { login, logout, register, currentUser, forgotPassword };
};

export default useAuth;
