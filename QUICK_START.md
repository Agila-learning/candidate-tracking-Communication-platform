# FIC Banking Chat Forum - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: MongoDB Atlas Connection

1. **Get your MongoDB Atlas connection string** from your dashboard
2. **Update server/.env file**:
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fic_banking?retryWrites=true&w=majority
   ```
3. **Test connection**:
   ```bash
   cd server
   node test-db-connection.js
   ```

> **Need detailed help?** See [`server/MONGODB_ATLAS_SETUP.md`](./server/MONGODB_ATLAS_SETUP.md)

### Step 2: Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm install  # First time only
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install  # First time only
npm run dev
```

**Access:** Open http://localhost:5173

---

## ✨ New Admin Features

### User Management
- **Enable/Disable Users** - Click status badge to toggle
- **Filter Users** - View Active/Inactive/All users  
- **Track Activity** - See last login timestamps
- **Prevent Lockout** - Cannot disable last admin

### Bank Partner Management
- **Control Access** - Activate/deactivate bank partners
- **Status Filters** - View active/inactive partners
- **Impact Warnings** - Alerts when disabling affects users

### Candidate Management
- **Assign to Banks** - Link candidates to bank partners during onboarding
- **Access Control** - Enable/disable candidate dashboard access
- **Client Filtering** - Bank users see only their assigned candidates

---

## 🔒 Security Features

✅ Disabled users cannot login (clear error message)  
✅ CLIENT_SUPPORT restricted to their bank's candidates only  
✅ Cannot disable the only active admin  
✅ Deactivating bank disables all its users  
✅ Last login tracking for audit purposes

---

## 📖 Documentation

- **MongoDB Setup**: `server/MONGODB_ATLAS_SETUP.md`
- **Full Walkthrough**: See artifacts in `.gemini/antigravity/brain/[conversation-id]/`
- **Implementation Plan**: Detailed technical changes documented

---

## 🧪 Testing Quick Checklist

- [ ] MongoDB connection test passes
- [ ] Can login as admin
- [ ] Can create and disable a user
- [ ] Disabled user cannot login (error message shows)
- [ ] Can re-enable user
- [ ] Can create and deactivate bank partner
- [ ] CLIENT_SUPPORT sees only assigned candidates
- [ ] Status filters work in all tabs

---

## 🆘 Troubleshooting

### "Authentication failed"
- Check username/password in connection string
- Verify no special characters need URL encoding

### "Connection timeout"
- Check IP whitelist in MongoDB Atlas
- Try allowing 0.0.0.0/0 for testing

### "Cannot read property 'isActive'"
- Restart server after model changes
- Existing records need database migration

### Need Help?
Run: `node server/test-db-connection.js` for diagnostics

---

## 📝 What Changed

**Backend:**
- Models: Added `isActive`, `lastLogin` fields
- Routes: New toggle status endpoints
- Auth: Active status checks on login

**Frontend:**
- UserManagement: Status toggles, filters, last login
- ClientManagement: Status toggles, filters, enhanced UI
- AdminDashboard: Client assignment for candidates
- Login: Better error messages

---

**Ready to go!** 🎉 Just connect your MongoDB Atlas and start testing!
