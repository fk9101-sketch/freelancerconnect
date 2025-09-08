import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC4n_Cum0CvMyrIIWiehMltWO92MYnCvgw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "freelancer-connect-899a8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "freelancer-connect-899a8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "freelancer-connect-899a8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "224541104230",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:224541104230:web:62bb08bdd9ae55872a35a7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GXMBYGFZPF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log("Attempting Google sign-in...");
    console.log("Current domain:", window.location.origin);
    console.log("Firebase config:", firebaseConfig);
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful:", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Handle specific popup errors
    if (error.code === 'auth/cancelled-popup-request' || 
        error.code === 'auth/popup-closed-by-user') {
      console.log("Popup was cancelled or closed by user");
      return null;
    }
    
    // Handle domain/redirect errors
    if (error.code === 'auth/unauthorized-domain') {
      console.error("Domain not authorized. Please add this domain to Firebase authorized domains:", window.location.origin);
    }
    
    if (error.code === 'auth/operation-not-allowed') {
      console.error("Google sign-in is not enabled. Please enable it in Firebase Console.");
    }
    
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
};

// Phone authentication
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log("reCAPTCHA solved");
    },
  });
};

export const sendOTP = async (phoneNumber: string, recaptcha: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptcha);
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

export const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
  try {
    const result = await confirmationResult.confirm(otp);
    return result.user;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export default app;