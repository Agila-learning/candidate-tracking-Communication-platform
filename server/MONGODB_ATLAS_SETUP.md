# MongoDB Atlas Setup Guide for FIC Banking Chat Forum

Follow these steps to connect your application to MongoDB Atlas.

## Step 1: Access Your MongoDB Atlas Dashboard

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in with your existing account
3. You should see your Organizations and Projects

## Step 2: Create or Select a Cluster

### If you already have a cluster:
- Select your existing cluster from the dashboard
- Skip to **Step 3**

### If you need to create a new cluster:
1. Click **"Build a Database"** or **"Create"**
2. Choose **FREE** tier (M0 Sandbox) for development
3. Select your preferred cloud provider (AWS/Google Cloud/Azure)
4. Choose a region close to you (e.g., Mumbai for India)
5. Name your cluster (e.g., `fic-banking-cluster`)
6. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 3: Configure Network Access

1. In the left sidebar, click **"Network Access"** under Security
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, add only your server's specific IP
4. Click **"Confirm"**

## Step 4: Create Database User

1. In the left sidebar, click **"Database Access"** under Security
2. Click **"Add New Database User"**
3. Set authentication method to **"Password"**
4. Create a username (e.g., `fic_admin`)
5. Click **"Autogenerate Secure Password"** and **COPY it immediately**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

**📋 Save these credentials:**
- Username: `_________________`
- Password: `_________________`

## Step 5: Get Your Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Choose **Driver: Node.js** and **Version: 5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your `.env` File

1. Open `server/.env` file
2. Replace your current `MONGODB_URI` with the Atlas connection string
3. Replace `<username>` with your database username
4. Replace `<password>` with your database password
5. Add your database name before the `?` (e.g., `fic_banking`)

**Example:**
```env
# Before
MONGODB_URI=mongodb://localhost:27017/fic_banking

# After (your actual values will be different)
MONGODB_URI=mongodb+srv://fic_admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/fic_banking?retryWrites=true&w=majority
```

## Step 7: Test the Connection

1. Open a terminal in the `server` directory
2. Run: `npm run dev`
3. Look for the message: **"Connected to MongoDB"**
4. If you see an error, check:
   - Username and password are correct
   - IP whitelist includes your IP (or 0.0.0.0/0)
   - Connection string format is correct

## Step 8: Verify Data in Atlas

1. Go to your cluster in Atlas
2. Click **"Browse Collections"**
3. You should see your database `fic_banking` with collections:
   - users
   - candidates
   - clients
   - conversations
   - messages
   - leads
   - resources

## Troubleshooting

### Error: "Authentication failed"
- Double-check username and password in `.env`
- Ensure no extra spaces in the connection string

### Error: "Connection timeout"
- Verify Network Access allows your IP
- Check your internet connection
- Try using 0.0.0.0/0 for testing

### Error: "Server selection timeout"
- Ensure cluster is active (not paused)
- Check if cluster is still creating (wait a few minutes)

## Security Best Practices

✅ **For Development:**
- Use 0.0.0.0/0 IP whitelist
- Keep credentials in `.env` file (never commit to git)

✅ **For Production:**
- Whitelist only your server's IP address
- Use strong passwords
- Rotate credentials regularly
- Enable MongoDB Atlas backup

## Next Steps

Once connected, your data will automatically sync to MongoDB Atlas in real-time. All your existing features will work the same way, but now with cloud persistence!

---

**Need Help?** Check MongoDB Atlas documentation: https://www.mongodb.com/docs/atlas/
