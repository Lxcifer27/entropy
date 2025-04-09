/**
 * Firebase Configuration Guide
 * 
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 
 * 2. Enable Authentication and Firestore in your Firebase project:
 *    - Go to Authentication > Sign-in method
 *    - Enable Email/Password and Google sign-in providers
 *    - Go to Firestore Database > Create database
 *    - Start in production mode and choose a location
 * 
 * 3. Register your web app in Firebase project settings
 *    - Go to Project settings > Your apps > Add app > Web
 *    - Register the app and copy the configuration
 * 
 * 4. Update your .env file with the Firebase configuration:
 *    VITE_FIREBASE_API_KEY=your_api_key
 *    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
 *    VITE_FIREBASE_PROJECT_ID=your_project_id
 *    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
 *    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
 *    VITE_FIREBASE_APP_ID=your_app_id
 * 
 * 5. Set up Firestore security rules for your database:
 * 
 * ```
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Allow users to read and write only their own data
 *     match /chatHistory/{document} {
 *       allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
 *       allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
 *     }
 *     
 *     // Default deny
 *     match /{document=**} {
 *       allow read, write: if false;
 *     }
 *   }
 * }
 * ```
 */

// This file serves as documentation for Firebase setup
// The actual Firebase configuration is in src/utils/firebase.js 