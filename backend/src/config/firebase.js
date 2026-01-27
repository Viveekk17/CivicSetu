const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Check if service account environment variables are present
// You can either use a serviceAccountKey.json file OR environment variables
// We will prioritize environment variables for better security in production

let serviceAccount;

try {
  // Option 1: Load from file if it exists (Good for local dev if you have the file)
  // const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  // if (fs.existsSync(serviceAccountPath)) {
  //   serviceAccount = require(serviceAccountPath);
  // }
} catch (error) {
  // File not found, ignore
}

if (!admin.apps.length) {
  try {
    // Initialize Firebase Admin
    // If you have set GOOGLE_APPLICATION_CREDENTIALS env var, this works automatically
    // Otherwise we construct cert from invididual vars
    
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
       admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle private key newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin Initialized with Env Vars');
    } else {
       // Fallback for development: Try to look for default credentials or just warn
       console.log('⚠️ Firebase Config missing: PROJECT_ID, CLIENT_EMAIL, or PRIVATE_KEY not found in .env');
       // Note: We don't throw here to allow app to start, but auth will fail
    }
   
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

module.exports = admin;
