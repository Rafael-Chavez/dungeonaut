# Security Guidelines for Dungeonaut

## Firebase API Key Security

The Firebase API key visible in `auth.js` is **intentionally public** - this is normal for client-side Firebase web applications. However, the following security measures MUST be in place:

### ✅ Security Measures Implemented

1. **Firestore Security Rules** - Users can only access their own data
2. **API Key Restrictions** - Key is restricted to specific domains
3. **Authentication Required** - All sensitive operations require user authentication

### 🔒 Firebase Console Security Setup

#### 1. Firestore Rules
Navigate to: [Firestore Rules](https://console.firebase.google.com/project/dungeonaut-b25af/firestore/rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /playerStats/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### 2. API Key Restrictions
Navigate to: [API Credentials](https://console.cloud.google.com/apis/credentials?project=dungeonaut-b25af)

**Allowed Domains:**
- `https://dungeonaut.vercel.app/*`
- `http://localhost:*`
- Add your production domain when deployed

#### 3. Authentication Settings
Navigate to: [Authentication](https://console.firebase.google.com/project/dungeonaut-b25af/authentication)

**Enabled Sign-in Methods:**
- ✅ Email/Password

**Security Settings:**
- Email enumeration protection: Enabled
- Require email verification: Recommended for production

### 🚨 If API Key is Compromised

Even if your API key is exposed, attackers CANNOT:
- Read/write other users' data (blocked by Firestore rules)
- Create unlimited accounts (use Firebase quotas)
- Access data without authentication (blocked by security rules)

However, if you suspect abuse:
1. Rotate the API key in [Firebase Console](https://console.firebase.google.com/project/dungeonaut-b25af/settings/general)
2. Update `auth.js` with the new key
3. Review [Firebase Usage Dashboard](https://console.firebase.google.com/project/dungeonaut-b25af/usage)

### 📚 Learn More
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Secure Your API Keys](https://firebase.google.com/docs/projects/api-keys)