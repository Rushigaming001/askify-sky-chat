# Building Askify Mobile App (APK for Android / iOS)

## What You Get
- **Real native mobile app** that can be installed like any other app
- **APK file for Android** that users can download and install
- **Full access to device features** like camera, notifications, etc.

## Steps to Build Your Mobile App

### 1. Export Your Project to GitHub
1. Click the **GitHub button** in the top right of Lovable
2. Connect your GitHub account if you haven't already
3. Export this project to your GitHub repository

### 2. Set Up Your Local Environment

#### For Android (APK):
- Install [Android Studio](https://developer.android.com/studio)
- Install [Node.js](https://nodejs.org/) (if not already installed)

#### For iOS (iPhone):
- Use a Mac computer
- Install [Xcode](https://developer.apple.com/xcode/) from the App Store
- Install [Node.js](https://nodejs.org/) (if not already installed)

### 3. Clone and Build

Open your terminal and run these commands:

```bash
# Clone your GitHub repository
git clone [your-github-repo-url]
cd [your-repo-folder]

# Install dependencies
npm install

# Build the web app
npm run build

# Add Android platform (for APK)
npx cap add android

# Update and sync
npx cap sync android

# Open in Android Studio to build APK
npx cap open android
```

### 4. Build APK in Android Studio

1. Android Studio will open your project
2. Wait for Gradle to finish syncing
3. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. Once done, click **locate** to find your APK file
5. The APK is in: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Install on Android Devices

- Transfer the APK to any Android device
- Open the APK file on the device
- Allow installation from unknown sources if prompted
- Install and use your Askify app!

## For iOS (App Store):

For iOS, you need:
- Apple Developer Account ($99/year)
- Mac computer with Xcode

```bash
# Add iOS platform
npx cap add ios

# Sync
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then build and sign in Xcode to distribute via TestFlight or App Store.

## Important Notes

- The APK you build is for testing/personal use
- To publish on Google Play Store, you need a Google Play Developer account ($25 one-time fee)
- To publish on Apple App Store, you need an Apple Developer account ($99/year)
- Each time you update your app in Lovable, export to GitHub again and rebuild

## Need Help?

If you get stuck, check out:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- Contact support at opgamer012321@gmail.com
