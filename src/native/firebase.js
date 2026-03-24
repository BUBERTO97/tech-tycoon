import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

// In React Native Expo, Google Auth usually requires Expo AuthSession
// For now we will return a mock or throw an error for them to hook up real Google Sign In later
export const loginWithGoogle = async () => {
    console.warn("Google Login in React Native requires Expo AuthSession or React Native Google Sign-In setup.");
    // They will need to install @react-native-google-signin/google-signin 
    // or use firebase/auth with expo-auth-session
    throw new Error('Google Sign for React Native requires additional setup.');
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error logging out", error);
        throw error;
    }
};

export const saveHighScore = async (user, score) => {
    if (!user) return;
    try {
        const userRef = doc(db, 'leaderboard', user.uid);
        const docSnap = await getDoc(userRef);
        let dataToSave = {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous CEO',
            photoURL: user.photoURL,
            highScore: score,
            lastPlayed: new Date()
        };
        
        if (docSnap.exists()) {
            const currentHigh = docSnap.data().highScore || 0;
            if (score > currentHigh) {
                await setDoc(userRef, dataToSave, { merge: true });
            }
        } else {
            await setDoc(userRef, dataToSave);
        }
    } catch (error) {
        console.error("Error saving high score", error);
    }
};

export const getLeaderboard = async (top = 10) => {
    try {
        const q = query(collection(db, 'leaderboard'), orderBy('highScore', 'desc'), limit(top));
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data());
        });
        return results;
    } catch (error) {
        console.error("Error fetching leaderboard", error);
        return [];
    }
};

export const saveUserData = async (user, data) => {
    if (!user) return;
    try {
        const userRef = doc(db, 'leaderboard', user.uid);
        await setDoc(userRef, data, { merge: true });
    } catch (error) {
        console.error("Error saving user data", error);
    }
};

export const getUserData = async (user) => {
    if (!user) return null;
    try {
        const userRef = doc(db, 'leaderboard', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error("Error getting user data", error);
        return null;
    }
};
