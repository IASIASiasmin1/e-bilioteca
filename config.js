import firebase from "firebase" 

const firebaseConfig = {
    apiKey: "AIzaSyBcDoIJfRqNUWDf98fIOyJyeWT4T70hBQs",
    authDomain: "e-biblioteca-4586a.firebaseapp.com",
    projectId: "e-biblioteca-4586a",
    storageBucket: "e-biblioteca-4586a.appspot.com",
    messagingSenderId: "128718885002",
    appId: "1:128718885002:web:4282d419adf9dc6957dd73"
  };

  firebase.initializeApp(firebaseConfig);
  
  export default firebase.firestore();