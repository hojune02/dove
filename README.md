# Dove: A Prayer Reminder App

An iOS app built and deployed by Hojune Kim - from product design to App Store submission with in-app subscriptions

---

## Overview

Dove is a daily prayer reminder application for iOS users. It contains an onboarding flow for collecting personalised information, a Bible quote reveal interaction, and a user-defined alarm reminder for prayers on chosen weekdays and time. The app provides monthly and yearly subscription with a 3-day free trial.

---

## Features

**Personalised onboardings** 
- collects name, faith practice, interested topics, and personal goals for personalised experience of the app

**Bible quote reveal** 
- handles tap-to-reveal interactions on the main prayer screen

**In-app subscription** 
- provides monthly and yearly subscription with a 3-day free trial

**Persistent user data** 
- stores user data locally on their devices using AsyncStorage
---

## Tech Stack

**React Native with Expo** (Expo SDK 54, TypeScript)

- **Expo Router** for file-based navigation
- **RevenueCat** for subscription management and paywall configuration
- **expo-notifications** for local push notifications when the user-set alarm is activated
- **AsyncStorage** for on-device data persistence
- **Expo Linear Gradient** for UI

---

## End-to-End Deployment

This app is built and shipped independently by Hojune Kim.

As of Feb 21, 2026:

- Apple Developer account setup and App Store Connect configuration (waiting for my Korean BRN) 🔄
- Linking App Store Connect API with RevenueCat ✅
- RevenueCat integrated with Expo for paywall rendering and entitlement management (I need my BRN to finish setting up products on App Store Connect) 🔄
- Development build pipeline via Expo and EAS (Expo Applications Services) ✅
- App Store submission in progress (waiting for my Korean BRN + verification) 🔄
