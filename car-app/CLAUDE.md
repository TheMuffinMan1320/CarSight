# CarSight

Expo React Native car spotting app with a Convex backend.

## Stack
- **Framework**: Expo SDK 54, React Native 0.81.5, React 19
- **Navigation**: Expo Router (file-based, tab layout)
- **Backend**: Convex (real-time DB + file storage)
- **Language**: TypeScript

## Project Structure
```
app/
  _layout.tsx          # Root layout — ConvexProvider + ThemeProvider
  (tabs)/
    _layout.tsx        # Tab bar (Collection, Watchlist, Home, Identify, Profile)
    collection.tsx     # Trading card collection screen (primary feature)
    watchlist.tsx      # Watchlist screen (stub)
    index.tsx          # Home screen
    identify.tsx       # Identify screen
    profile.tsx        # Profile screen

convex/
  schema.ts            # DB schema
  spottedCars.ts       # CRUD + file storage for spotted cars
  watchlist.ts         # CRUD for watchlist
  _generated/          # Auto-generated Convex types (do not edit)

components/
  themed-text.tsx      # Text with light/dark theme support
  themed-view.tsx      # View with light/dark theme support
  ui/
    icon-symbol.tsx    # SF Symbols → MaterialIcons mapping (cross-platform)
    collapsible.tsx    # Collapsible section component

constants/
  theme.ts             # Colors (light/dark) and Fonts (Platform.select)

hooks/
  use-color-scheme.ts
  use-theme-color.ts
```

## Convex Setup
- Deployment: `wandering-jellyfish-357.convex.cloud`
- Env var: `EXPO_PUBLIC_CONVEX_URL` (in `.env.local`)
- Run dev server: `npx convex dev`

## Database Schema

### spottedCars
| Field          | Type                   |
|----------------|------------------------|
| brand          | string                 |
| model          | string                 |
| horsepower     | number                 |
| spottedDate    | string (ISO)           |
| imageStorageId | optional _storage id   |

### watchlist
| Field | Type   |
|-------|--------|
| brand | string |
| model | string |

## Key Patterns

**Querying data:**
```tsx
const cars = useQuery(api.spottedCars.getAllSpotted);
```

**Mutations:**
```tsx
const addCar = useMutation(api.spottedCars.addSpottedCar);
await addCar({ brand, model, horsepower, spottedDate, imageStorageId });
```

**Image upload flow (Convex file storage):**
1. `generateUploadUrl()` mutation → upload URL string
2. `fetch(imageUri)` → blob
3. `POST blob` to upload URL → `{ storageId }`
4. Pass `storageId` to `addSpottedCar`
5. `getAllSpotted` resolves each `imageStorageId` → `imageUrl` in the query

**Theming:**
```tsx
const colorScheme = useColorScheme() ?? "light";
const isDark = colorScheme === "dark";
// Colors.light / Colors.dark, Fonts.rounded / Fonts.mono etc.
```

## Installed Packages (notable)
- `expo-image` — image display (`<Image contentFit="cover" />`)
- `expo-image-picker` — camera + photo library access
- `expo-symbols` — SF Symbols (iOS only; falls back to MaterialIcons)
- `react-native-safe-area-context` — safe area insets
- `react-native-reanimated` — animations
- `convex` — backend client
