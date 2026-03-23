import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error logging in with Google", error);
        throw error;
    }
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
