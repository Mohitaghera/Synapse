
# Messaging

The Messaging project is a modern web application that facilitates real-time messaging between users. It harnesses the power of React.js for the frontend user interface, providing an interactive and intuitive experience. Firebase serves as the backend, handling real-time data synchronization and storage. brief description of what this project does and who it's for


## Tech Stack

**Client:** ReactJS,Bootstrap 5.0

**Server:** Firebase(Authentication, Realtime Database)


## Features

- Real-Time Messaging: Engage in real-time conversations with other users.
- User Authentication: Secure user authentication and authorization.
- User Status: See the status of Users, such as online and lastseen.
- Search Functionality: Search for users to start new conversations.


## Installation

Install messaging with github

```bash
git clone https://github.com/ParthMi/messaging.git
cd messaging
npm install
```
    
## Configuration
Before you can run the project, you need to configure Firebase for backend services.

1. Create a Firebase project on the Firebase Console.
2. Obtain your Firebase configuration settings (apiKey, authDomain, projectId, etc.).
3. Edit a file named firebase.jsx in the src/context directory:

```bash
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other config options
};

export default firebaseConfig;
```
## Run Locally
Go to the project directory

```bash
  npm start
```

