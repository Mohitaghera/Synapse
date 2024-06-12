import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase} from "firebase/database";


const firebaseConfig = {
  apiKey: "#",
  authDomain: "#",
  projectId: "#",
  storageBucket: "#",
  messagingSenderId: "#",
  appId: "#",
  measurementId: "#",
  databaseURL: "#",
};

const app = initializeApp(firebaseConfig);
const database=getDatabase(app);
const analytics = getAnalytics(app);
