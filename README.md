# 🌐 IEEE CompConnect

[![React Native](https://img.shields.io/badge/React_Native-0.74+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Hugging Face](https://img.shields.io/badge/AI_Powered-Hugging_Face_NLP-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)

> **A smart, unified mobile community platform for IEEE Student Branches, chapters, and tech enthusiasts.**  
> Developed as an academic Capstone Project (2.2 Semester).

---

## 📖 Overview

**IEEE CompConnect** connects students, IEEE members, committee leaders, and organizers into a single collaborative ecosystem. From intelligent news feeds and event ticketing to real-time chat and student branch administration, CompConnect streamlines university-level IEEE activities and community engagement.

---

## ✨ Key Features

### 📰 Smart Feed & Articles
- **AI-Powered Feed:** Recommends technical posts and event announcements tailored to user interests using zero-shot NLP classification.
- **Knowledge Base:** Publish, read, and bookmark IEEE articles, tech trends, and research updates.

### 👥 Groups & Communities
- **Special Interest Groups (SIGs):** Create, discover, and join specialized interest groups (e.g., AI/ML, Robotics, WebDev).
- **Interactive Discussions:** Community comment threads, reactions, and peer discussions.

### 🎟️ Event Ticketing & Registration
- **Event Discovery:** Browse upcoming workshops, hackathons, and guest lectures.
- **Digital Passes:** Seamless registration with digital ticket passes and verification.

### 💬 Real-Time Messaging & Networking
- One-on-one and group messaging for active student collaboration and event planning.

### 🛡️ Role-Based Access Control (RBAC)
- **Members / Students:** Explore feeds, attend events, message peers, and participate in groups.
- **Organizers:** Manage registrations, oversee ticketing, and publish official announcements.
- **Administrators:** Branch governance, member approvals, analytics, and platform settings.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Mobile Client - Expo / React Native] --> B[Expo Router & Navigation]
    B --> C[State Management & Stores]
    C --> D[Firebase Auth & Firestore]
    C --> E[Hugging Face Inference API]
    E -->|Zero-Shot Classification| F[Smart Feed Personalization]
    D -->|Realtime Data & Storage| A


---

