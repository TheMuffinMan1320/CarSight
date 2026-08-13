# CarSight

A social car spotting platform for iOS built with Expo and React Native. CarSight lets users identify cars with on-device AI, build a personal spotted car collection, follow other enthusiasts, and book professional automotive photographers.

![CarSight demo](demo.gif)

*Recorded on the iOS Simulator — Profile, Collection, Watchlist, and the social Feed. The
Identify screen's camera view is blank because the Simulator has no camera hardware; the
on-device CoreML/TFLite identification only runs on a real device.*

---

## Features

### AI Car Identification
- On-device TensorFlow Lite model (Stanford Cars dataset, 196 classes)
- Instant identification from camera — no internet required
- Displays predicted make, model, body type, and confidence score
- Runs entirely on-device using Apple's CoreML delegate for fast inference

### Car Collection
- Log spotted cars with make, model, horsepower, price, and photo
- Trading card-style grid layout
- Search, sort (date, name, horsepower, price), and filter by favourites
- Full edit and delete support per entry

### Social Feed
- Instagram-style feed showing posts from followed users
- Three post types: **Spotted Car**, **Car Meet**, **Photography**
- Like and comment on posts
- Discover and follow other users via search
- View any user's profile, stats, and collection

### Watchlist
- Add cars you want to spot (make + model)
- Automatically removed from your watchlist when you or someone you follow spots a match
- Push notification when a watchlist car is spotted

### Photographer Booking
- Toggle photographer mode in your profile
- Publish availability slots with date, time window, price, and description
- Other users can browse and book sessions directly in-app
- Push notifications for new bookings and cancellations

### Maps
- View nearby car spots on an interactive map from the feed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81.5, React 19 |
| Language | TypeScript |
| Navigation | Expo Router (file-based, tab layout) |
| Backend | Convex (real-time database + file storage) |
| Auth | `@convex-dev/auth` (password-based) |
| AI / ML | `react-native-fast-tflite` + CoreML delegate |
| Camera | `expo-camera`, `expo-image-picker`, `expo-image-manipulator` |
| Maps | `react-native-maps`, `expo-location` |
| Notifications | `expo-notifications` |
| Storage | `expo-secure-store` (iOS Keychain) |
| Animations | `react-native-reanimated` |

---

## Project Structure

```
app/
  _layout.tsx              # Root layout — ConvexProvider + auth routing
  (auth)/                  # Sign in / sign up screens
  (tabs)/
    _layout.tsx            # Tab bar (Home, Collection, Identify, Watchlist, Profile)
    index.tsx              # Social feed
    collection.tsx         # Spotted car collection
    identify.tsx           # AI car identification (camera)
    watchlist.tsx          # Watchlist
    profile.tsx            # User profile + photographer scheduling

convex/
  schema.ts                # Database schema
  spottedCars.ts           # Collection CRUD + file storage
  posts.ts                 # Feed posts, likes, comments
  follows.ts               # Follow / unfollow
  userProfile.ts           # Profile management, user search
  watchlist.ts             # Watchlist CRUD + matching logic
  availability.ts          # Photographer slots + bookings
  auth.ts                  # Auth configuration

assets/
  stanford_cars_classifier.tflite   # On-device AI model
  car_labels.json                   # 196 class labels
```

---

## Database Schema

**spottedCars** — `userId`, `brand`, `model`, `horsepower`, `price`, `spottedDate`, `imageStorageId`, `isFavorite`

**watchlist** — `userId`, `brand`, `model`

**posts** — `userId`, `type` (spotted_car | car_meet | photography), `caption`, `imageStorageId`, `brand`, `model`, `title`, `location`, `eventDate`

**follows** — `followerId`, `followingId`

**postLikes** — `postId`, `userId`

**comments** — `postId`, `userId`, `text`

**userProfile** — `userId`, `displayName`, `imageStorageId`, `isPhotographer`, `portfolioUrl`, `pushToken`

**availability** — `photographerId`, `date`, `startTime`, `endTime`, `price`, `description`, `bookedByUserId`, `bookedByPhone`

---

## Getting Started

### Prerequisites
- Node.js 18+
- Xcode (for iOS builds)
- Expo CLI
- A Convex account

### Installation

```bash
git clone https://github.com/your-username/CarSight.git
cd CarSight/car-app
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Start the Convex dev server:

```bash
npx convex dev
```

### Running on Device

CarSight uses native modules (TFLite, camera) and requires a custom dev build — it does not run in Expo Go.

```bash
npx expo run:ios --device
```

After the initial build, start the Metro bundler for hot reload:

```bash
npx expo start
```

---

## AI Model

The identify feature uses a TensorFlow Lite model trained on the [Stanford Cars Dataset](https://ai.stanford.edu/~jkrause/cars/car_dataset.html), which contains 196 classes of cars.

Inference runs entirely on-device:
1. Photo is captured and resized to 224×224
2. Pixels are normalised to `[0, 1]` and passed to the model as a `Float32Array`
3. The output softmax scores are mapped to `car_labels.json`
4. The top prediction is displayed with its confidence percentage

On iOS, inference uses Apple's CoreML delegate for hardware-accelerated performance.

---

## Authentication

Authentication is handled by `@convex-dev/auth` using a password provider. Credentials are stored securely in the iOS Keychain via `expo-secure-store`. All Convex queries and mutations enforce server-side auth — unauthenticated requests return null or empty results.

Required environment variables in the Convex dashboard:
- `JWT_PRIVATE_KEY`
- `JWKS`
- `AUTH_SECRET`
- `SITE_URL`
