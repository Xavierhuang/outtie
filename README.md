# Outtie

A peer-to-peer clothing rental platform for Columbia University students.

## 🎯 About

Outtie is a mobile-first platform that enables Columbia students to rent and lend clothing within their campus community. Built with React Native (Expo) for the frontend and Node.js/Express for the backend.

## 🏗️ Tech Stack

### Frontend (Mobile App)
- React Native with Expo
- TypeScript
- React Navigation
- React Native Reanimated (for swipe gestures)
- AsyncStorage

### Backend (API)
- Node.js with Express
- TypeScript
- SQLite database
- JWT authentication
- Multer (file uploads)

## 📁 Project Structure

```
outtie/
├── mobile-app/          # React Native (Expo) mobile application
│   ├── src/
│   │   ├── screens/     # App screens
│   │   ├── contexts/    # React contexts (Auth, etc.)
│   │   ├── services/    # API services
│   │   ├── navigation/  # Navigation setup
│   │   └── types/       # TypeScript types
│   └── package.json
│
└── backend/             # Node.js/Express API
    ├── src/
    │   ├── controllers/ # Route controllers
    │   ├── models/      # Data models
    │   ├── routes/      # API routes
    │   ├── config/      # Configuration files
    │   └── app.ts       # Main application
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.19.4
- npm or yarn
- Expo CLI (for mobile development)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Create and configure your .env file
npm run build
npm start
```

### Mobile App Setup

```bash
cd mobile-app
npm install
npm start
```

## 🌐 Deployment

**Production URL:** https://app.outtie.ai

### Backend
- Hosted on DigitalOcean
- PM2 for process management
- Nginx as reverse proxy
- SSL/HTTPS with Let's Encrypt

### Frontend
- Web version deployed to same server
- Mobile apps built with Expo EAS Build

## 🔑 Environment Variables

### Backend `.env`
```
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key
DATABASE_PATH=/path/to/database.sqlite
```

### Mobile App
Update `src/services/api.ts` with your API URL.

## 📱 Features

- User authentication (Columbia email required)
- Student verification
- Browse items (Tinder-style swipe interface)
- Save favorite items
- List your own items for rent
- User profiles
- Rental management
- Reviews and ratings

## 🔒 Security

- JWT-based authentication
- Columbia email verification required
- Secure password hashing
- HTTPS/SSL encryption in production

## 📄 License

Private project - All rights reserved

## 👥 Team

Built for the Columbia University community.
