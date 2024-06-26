import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_APP_ID,
	measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

let firebaseApp =
	getApps().length == 0 ? initializeApp(firebaseConfig) : getApps()[0];

const analytics = isSupported().then((yes) =>
	yes ? getAnalytics(firebaseApp) : null
);

export default firebaseApp;
