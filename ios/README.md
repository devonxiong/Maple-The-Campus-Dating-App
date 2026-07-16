# 🍁 Maple iOS

Native SwiftUI client for Maple — reuses the existing Supabase + Next.js backend.
Built for the App Store, US launch (Claremont Colleges / 5C).

## Architecture

The iOS app is a **thin native client**. All server logic stays in the existing
web backend and is reused as-is:

- **Direct to Supabase** (PostgREST) for feed reads, swipes, matches — governed by
  Row-Level Security. See `Networking/SupabaseREST.swift`.
- **To the Next.js API** (`https://www.maplemeet.ai/api/*`) for anything that must
  stay server-side: email OTP, password hashing, AI date planning, avatar upload,
  SMS, account deletion. See `Networking/BackendAPI.swift`.

```
MapleiOS/
  App/            App entry + tab routing
  Config/         AppConfig + Secrets.xcconfig (gitignored)
  DesignSystem/   Theme, reusable components, FlowLayout
  Localization/   EN / 中文 strings (ported from lib/i18n.ts)
  Models/         Codable models (mirror types/index.ts + schema.sql)
  Networking/     SupabaseREST + BackendAPI clients
  Stores/         AppState (session), FeedStore (scoring, ported from lib/score.ts)
  Features/       Landing, Onboarding, Login, Feed, Match, Matches, Profile,
                  Legal, Safety, Resources
  Resources/      Info.plist, Assets.xcassets
```

## First-time setup

```bash
cd ios

# 1. Install the project generator (once)
brew install xcodegen

# 2. Create your local secrets file (already present locally; recreate from example if needed)
cp MapleiOS/Config/Secrets.example.xcconfig MapleiOS/Config/Secrets.xcconfig
#   → fill in MAPLE_SUPABASE_URL, MAPLE_SUPABASE_ANON_KEY, MAPLE_API_BASE

# 3. Generate the Xcode project
xcodegen generate

# 4. Open it
open MapleiOS.xcodeproj
```

> The Supabase **anon** key is a public client credential (protected by RLS), so
> shipping it in the app binary is expected and safe. It's injected from
> `Secrets.xcconfig` → Info.plist → `AppConfig`, never hardcoded in source.

## What's implemented

| Web page            | iOS screen                        | Status |
|---------------------|-----------------------------------|--------|
| `/` landing         | `LandingView`                     | ✅ |
| signup wizard       | `OnboardingView` (email→code→name→gender→prefs→spots→password) | ✅ |
| login               | `LoginView`                       | ✅ |
| `/feed`             | `FeedView` (swipe cards + report/block/blind box) | ✅ |
| `/match`            | `MatchView` (reveal + AI date planning) | ✅ |
| `/matches`          | `MatchesView`                     | ✅ |
| `/date` card        | inside `MatchView`                | ✅ |
| `/profile` (Me)     | `ProfileView` (avatar upload, settings) | ✅ |
| `/resources`        | `ResourcesView`                   | ✅ |
| `/safety`           | `SafetyView` (live location share)| ✅ |
| `/privacy` `/terms` | `LegalView`                       | ✅ |
| EN / 中文 toggle     | `LangStore` + `LangToggle`        | ✅ |

## Deferred / next iteration (documented, not yet built)

These exist on the web but need native equivalents before a polished launch:

- **Map spot picker** — onboarding uses curated 5C chips for now. To add an
  interactive map, drop in a `MapKit` `Map` view (recommended for the US launch —
  Apple Maps has excellent US coverage) **or** the Google Maps iOS SDK if you want
  parity with the web (`https://github.com/googlemaps/ios-maps-sdk` via SPM + a
  Maps API key in `Secrets.xcconfig`).
- **Realtime match notifications** — the web uses Supabase Realtime websockets.
  Add via a `URLSessionWebSocketTask` to `wss://<project>.supabase.co/realtime/v1`
  or the supabase-swift SDK, plus APNs push for background alerts.
- **Spotify connect** — OAuth flow to populate `spotify_interests` for the music
  overlap boost in scoring.
- **Schedule screenshot parsing** — the `parse-schedule` endpoint (Claude vision)
  wired to a PhotosPicker in onboarding for calendar-aware date times.

See `APP_STORE.md` for the submission walkthrough.
