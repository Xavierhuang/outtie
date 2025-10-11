# 📱 Outtie - Build & Export Guide

This guide will help you build **APK** (Android) and **IPA** (iOS) files for distribution.

## 🚀 Quick Start

### Prerequisites
- Expo account (free): https://expo.dev/signup
- Node.js installed
- All project dependencies installed

## 📋 Step-by-Step Build Process

### Step 1: Create Expo Account & Login
```bash
# Create account at https://expo.dev/signup first
npx eas-cli@latest login
```
Enter your Expo credentials when prompted.

### Step 2: Configure Your Project
```bash
npx eas-cli@latest build:configure
```
This will:
- Create an EAS project
- Generate a project ID
- Update your `app.json`

### Step 3: Build for Android (APK)
```bash
# For testing/internal distribution (APK)
npx eas-cli@latest build --platform android --profile preview

# For production (AAB - Google Play)
npx eas-cli@latest build --platform android --profile production
```

### Step 4: Build for iOS (IPA)
```bash
# For testing/internal distribution
npx eas-cli@latest build --platform ios --profile preview

# For production (App Store)
npx eas-cli@latest build --platform ios --profile production
```

### Step 5: Download Your Builds
After builds complete (5-15 minutes each):
1. Go to https://expo.dev/accounts/[your-username]/projects/outtie-app/builds
2. Download the APK/IPA files
3. Share or distribute as needed

## 📦 Build Profiles Explained

### Preview Profile
- **Android**: Generates APK file
- **iOS**: Generates IPA for testing
- **Use for**: Beta testing, internal distribution
- **No signing**: Can install on any device (Android) or TestFlight (iOS)

### Production Profile
- **Android**: Generates AAB file for Google Play
- **iOS**: Generates IPA for App Store
- **Use for**: Official app store releases
- **Requires**: Store developer accounts

## 🔧 Alternative: Local Development Build

For testing during development:
```bash
# Install Expo Go app on your phone
npm start

# Then scan QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

## 📱 Installation Methods

### Android APK
1. Enable "Unknown Sources" in Android settings
2. Transfer APK to phone
3. Tap to install

### iOS IPA (Testing)
1. Use TestFlight for beta testing
2. Or use services like Diawi.com for direct installation
3. Enterprise distribution (requires Apple Developer Enterprise account)

## 🛠️ Build Commands Reference

```bash
# Check EAS CLI version
npx eas-cli@latest --version

# Login to Expo
npx eas-cli@latest login

# Configure project
npx eas-cli@latest build:configure

# Build both platforms
npx eas-cli@latest build --platform all

# Check build status
npx eas-cli@latest build:list

# View build logs
npx eas-cli@latest build:view [build-id]

# Submit to stores (after production builds)
npx eas-cli@latest submit --platform android
npx eas-cli@latest submit --platform ios
```

## ⚡ Pro Tips

### Faster Builds
- Build during off-peak hours for faster queue times
- Use `--local` flag if you have Xcode/Android Studio setup locally

### Multiple Builds
- You get **unlimited free builds** on Expo's free plan
- Builds run in parallel, so you can build both platforms simultaneously

### Version Management
- Update `version` in `app.json` for each new build
- iOS `buildNumber` and Android `versionCode` auto-increment in production

## 🔍 Troubleshooting

### Build Fails?
1. Check build logs in Expo dashboard
2. Ensure all dependencies are compatible with Expo
3. Verify app.json configuration

### Can't Install APK?
- Enable "Install Unknown Apps" in Android settings
- Some phones block installation from unknown sources

### iOS Installation Issues?
- Use TestFlight for easiest testing
- Direct IPA installation requires specific provisioning

## 📋 Pre-Build Checklist

- [ ] Backend API is deployed and accessible
- [ ] Update API_URL in `src/services/api.ts` to production URL
- [ ] Test app thoroughly on both platforms
- [ ] Update version numbers in `app.json`
- [ ] Verify all app permissions are necessary
- [ ] Test offline functionality (if any)

## 🎯 Distribution Options

### For Testing
1. **APK**: Direct installation on Android
2. **TestFlight**: iOS beta testing (requires Apple Developer account)
3. **Expo Go**: Development testing

### For Production
1. **Google Play Store**: Official Android distribution
2. **Apple App Store**: Official iOS distribution
3. **Enterprise**: Internal company distribution

---

## 🚀 Ready to Build?

Run these commands in order:

```bash
# 1. Login to Expo
npx eas-cli@latest login

# 2. Configure project
npx eas-cli@latest build:configure

# 3. Build both platforms for testing
npx eas-cli@latest build --platform all --profile preview
```

Your builds will be ready for download in 10-20 minutes! 🎉

---

**Need help?** Check the [Expo Documentation](https://docs.expo.dev/build/introduction/) or contact the development team.
