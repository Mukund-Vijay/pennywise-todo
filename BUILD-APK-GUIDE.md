# 📱 Build APK Guide - Share Your App!

## 🎯 Build APK in 3 Steps

### Method 1: Using Android Studio (Easiest)

1. **Open the project:**
   ```bash
   npm run mobile:android
   ```
   Wait for Android Studio to open and Gradle sync to finish.

2. **Build the APK:**
   - Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait 1-2 minutes for build to complete
   - Click **"locate"** in the notification when done

3. **Find your APK:**
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```
   
4. **Share it!** Send this file to anyone via WhatsApp, email, etc.

### Method 2: Using Command Line (Faster)

```bash
cd android
.\gradlew assembleDebug
```

APK will be at: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## 📤 How Your Friend Installs It

1. **Download** the APK file to their Android phone
2. **Enable** "Install from Unknown Sources":
   - Settings → Security → Unknown Sources → ON
   - Or Settings → Apps → Special Access → Install Unknown Apps
3. **Tap** the APK file in Downloads
4. **Install** and open the app!

---

## ⚠️ Important: Server Configuration

### For Testing on Same WiFi

If your friend is on the **same WiFi** as you:

1. Find your PC's IP address:
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., `192.168.1.100`)

2. Update `capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "http://192.168.1.100:3000",
       "cleartext": true
     }
   }
   ```

3. Update `public/app.js` line 3:
   ```javascript
   const API_URL = 'http://192.168.1.100:3000/api';
   ```

4. Rebuild APK:
   ```bash
   npm run mobile:sync
   cd android
   .\gradlew assembleDebug
   ```

5. Make sure `npm start` is running on your PC!

### For Using from Anywhere (Recommended)

Deploy your backend online first, then update URLs:

#### Option 1: Deploy to Railway.app (Free, Easy)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repo or upload your code
5. Railway gives you a URL like `https://your-app.railway.app`

#### Option 2: Deploy to Render.com

1. Go to https://render.com
2. Sign up and create new **Web Service**
3. Connect your GitHub or upload code
4. Render gives you a URL like `https://your-app.onrender.com`

#### Update Your App with Online Server

1. Edit `capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "https://your-app.railway.app",
       "cleartext": false
     }
   }
   ```

2. Edit `public/app.js` line 3:
   ```javascript
   const API_URL = 'https://your-app.railway.app/api';
   ```

3. Rebuild APK:
   ```bash
   npm run mobile:sync
   cd android
   .\gradlew assembleDebug
   ```

Now your friend can use it from anywhere! 🌍

---

## 🚀 Build Release APK (For Publishing)

For a smaller, optimized APK for Google Play Store:

### Step 1: Generate Signing Key

```bash
cd android/app
keytool -genkey -v -keystore pennywise-release-key.keystore -alias pennywise -keyalg RSA -keysize 2048 -validity 10000
```

Enter a password and your details.

### Step 2: Configure Gradle

Create `android/key.properties`:
```properties
storePassword=your-keystore-password
keyPassword=your-key-password
keyAlias=pennywise
storeFile=pennywise-release-key.keystore
```

### Step 3: Build Release APK

```bash
cd android
.\gradlew assembleRelease
```

Release APK will be at: `android\app\build\outputs\apk\release\app-release.apk`

This is smaller and more secure for public distribution!

---

## 📏 APK Size

- **Debug APK**: ~5-10 MB
- **Release APK**: ~3-7 MB (smaller, optimized)

---

## ✅ Quick Checklist

- [ ] Backend server is running (`npm start`) OR deployed online
- [ ] Server URL is configured correctly in `capacitor.config.json`
- [ ] Server URL is configured correctly in `public/app.js`
- [ ] Synced changes: `npm run mobile:sync`
- [ ] Built APK in Android Studio or via gradle
- [ ] APK file found in `android/app/build/outputs/apk/debug/`
- [ ] Shared APK file with friend!

---

## 🎈 Tips

- **Debug APK** is fine for testing with friends
- **Release APK** is needed for Google Play Store
- Always rebuild APK after changing server URLs
- Test the APK on your own phone first before sharing!

**Your Pennywise Todo app is ready to share! 🎪**
