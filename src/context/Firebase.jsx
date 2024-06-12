import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase} from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyBKlNEF7at3XRgQ-J5hzdy3awcsjgRJ-gI",
  authDomain: "massages-79084.firebaseapp.com",
  projectId: "massages-79084",
  storageBucket: "massages-79084.appspot.com",
  messagingSenderId: "154262919267",
  appId: "1:154262919267:web:ebed58f0fc1321c19c4056",
  measurementId: "#",
  databaseURL: "https://massages-79084-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const database=getDatabase(app);
const analytics = getAnalytics(app);
