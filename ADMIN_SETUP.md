# Admin Dashboard Setup Guide

## ✅ Admin Dashboard Complete!

The admin dashboard with role-based access control (RBAC) is now fully integrated into Dungeonaut.

---

## 🔑 User Roles

### **Admin (Level 3)** - Full Access
- All moderator permissions
- Edit player stats
- Unban players
- Edit game settings (maintenance mode)
- Create global events
- Export analytics data

### **Moderator (Level 2)** - Player & Content Management
- View all players
- Ban players (cannot unban)
- View and resolve reports
- Delete inappropriate content
- View analytics

### **Tester (Level 1)** - Testing Features
- Access test environment
- Debug mode
- Reset test stats
- Simulate battles
- Unlock all achievements (test only)

### **Player (Level 0)** - No Admin Access
- Default role for all users

---

## 📋 How to Assign Roles

### Method 1: Firebase Console (Recommended)

1. **Go to Firestore Database**
   - Visit: https://console.firebase.google.com/project/dungeonaut-b25af/firestore

2. **Create the `userRoles` Collection**
   - Click "Start collection"
   - Collection ID: `userRoles`

3. **Add a Document for Each Admin User**
   - Document ID: `<user's Firebase UID>`
   - Field: `role` (string)
   - Value: `"admin"`, `"moderator"`, or `"tester"`

**Example:**
```
Collection: userRoles
└── Document: 3edriTNzUeRjh4nm8wmbIfpDCPx2
    └── role: "admin"
```

### Method 2: Get User UID

To find a user's UID:

1. Go to Firebase Console → Authentication
2. Find the user by email
3. Copy their UID
4. Use it as the document ID in `userRoles` collection

---

## 🔒 Firestore Security Rules

Add these rules to protect admin data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Player stats
    match /playerStats/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // User roles - read by all authenticated, write only by server
    match /userRoles/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // Only writable via Firebase Admin SDK
    }

    // Banned users - only moderators/admins can write
    match /bannedUsers/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role in ['moderator', 'admin'];
    }

    // Game settings - only admins can read/write
    match /gameSettings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin';
    }

    // Global events - only admins can write
    match /globalEvents/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🎮 How to Access Admin Dashboard

1. **Login to your account** with email/password
2. If you have admin/moderator/tester role, you'll see a **"🔐 Admin Panel"** button on the main menu
3. Click it to open the dashboard

**Note:** The admin button only appears if you have a role assigned in Firestore.

---

## 🧪 Testing the Admin Dashboard

### Quick Test Setup:

1. **Assign yourself as admin:**
   ```
   Firestore → userRoles → [Your UID]
   role: "admin"
   ```

2. **Login and access:**
   - Login to Dungeonaut
   - Go to main menu
   - Click "Admin Panel"

3. **Test features:**
   - View all players
   - Check analytics
   - Test debug mode
   - Simulate a battle

---

## 📊 Available Admin Features

### Player Management
- View all registered players
- Ban/unban players
- Edit player stats (admin only)

### Content Moderation
- View reports (placeholder - implement as needed)
- Delete content (moderator+)

### Game Settings
- View current settings
- Toggle maintenance mode (admin only)
- Create global events (admin only)

### Test Environment
- Toggle debug mode
- Reset test stats
- Unlock all achievements (for testing)
- Simulate battles

### Analytics
- Total players
- Active today
- Total matches
- Banned players
- Export data (admin only)

---

## 🚀 Production Checklist

Before going live:

- [ ] Set up Firestore security rules (see above)
- [ ] Assign admin roles to trusted users
- [ ] Test ban/unban functionality
- [ ] Verify role permissions work correctly
- [ ] Set up monitoring for admin actions
- [ ] Consider adding audit logging

---

## 🛡️ Security Best Practices

1. **Never commit role assignments to code** - Always use Firestore
2. **Limit admin users** - Only assign to trusted team members
3. **Use security rules** - Prevent unauthorized access
4. **Monitor admin actions** - Log important operations
5. **Regular audits** - Review who has admin access

---

## 📝 Next Steps

1. Assign your first admin user in Firestore
2. Login and test the admin panel
3. Set up Firestore security rules
4. Consider adding:
   - Audit logging for admin actions
   - Email notifications for bans
   - More detailed analytics
   - Report system implementation

---

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/project/dungeonaut-b25af
- Firestore Database: https://console.firebase.google.com/project/dungeonaut-b25af/firestore
- Authentication Users: https://console.firebase.google.com/project/dungeonaut-b25af/authentication
- Security Rules: https://console.firebase.google.com/project/dungeonaut-b25af/firestore/rules

---

**Admin dashboard is ready to use!** 🎉
