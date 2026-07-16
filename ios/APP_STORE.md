# 🍁 Maple — App Store Submission Guide

A practical walkthrough for shipping Maple to the US App Store. Dating apps get
**extra review scrutiny** (Guideline 1.2 – user-generated content, and 4.3 – spam),
so a few things are non-negotiable. This guide flags them.

---

## 1. Apple Developer Program (you need this first — $99/year)

1. Create/sign in with an **Apple ID** with two-factor auth enabled.
2. Go to <https://developer.apple.com/programs/enroll/>.
3. Enroll as an **Individual** (fastest) or **Organization** (needs a D-U-N-S
   number; required if you want the seller name to be "Maple Inc." instead of your
   personal name — recommended for a real product, but takes 1–2 weeks longer).
4. Pay $99. Approval is usually minutes (Individual) to a few days (Org).

Once approved, in Xcode → Settings → Accounts, add your Apple ID. Copy your
**Team ID** (developer.apple.com → Membership) into `Secrets.xcconfig`:

```
DEVELOPMENT_TEAM = YOURTEAMID
```

Then set the bundle id `ai.maplemeet.app` (already the default) to your team and
let Xcode manage signing automatically.

---

## 2. Register the app in App Store Connect

1. <https://appstoreconnect.apple.com> → **Apps** → **+** → New App.
2. Platform iOS · Name **Maple** · Primary language English (U.S.) ·
   Bundle ID `ai.maplemeet.app` · SKU `maple-ios`.
3. Create it. You'll fill in metadata later.

---

## 3. Required before a dating app will pass review

These are the ones that get dating apps **rejected** if missing:

- **Age rating 17+.** In App Store Connect → your app → Age Rating, answer the
  questionnaire honestly (frequent/intense mature themes → 17+). Dating apps must
  be 17+.
- **Account deletion inside the app.** ✅ Already built — Profile → delete account
  (`delete-account` endpoint). Apple requires in-app deletion, not just email.
- **Block + report users.** ✅ Already built — report/block on every feed card.
  Apple Guideline 1.2 requires: a way to report content, a way to block abusive
  users, and a published contact for reports (`hello@maplemeet.ai`) — all present.
- **A filter/moderation commitment.** In the App Review notes, state that reports
  are reviewed within 24 hours and abusive users are auto-blocked on report
  (the app does this today).
- **Privacy Policy + Terms URLs.** Host the web `/privacy` and `/terms` pages and
  put the URLs in App Store Connect. ✅ Content is also in-app (`LegalView`).
- **Privacy "Nutrition Label."** In App Store Connect → App Privacy, declare what
  you collect. For Maple: **Contact Info** (name, email, phone), **Location**
  (approximate, used for app functionality, not tracking), **User Content**
  (photos), **Identifiers** (user ID), **Usage Data**. Mark location as *not used
  for tracking* and *not linked to identity for advertising*.
- **Permission strings.** ✅ Already in `Info.plist` (location, camera, photos,
  contacts) with clear purposes.
- **Login for review.** App Review can't verify a `.edu` email, so provide a
  **demo account** (email + password) in the "App Review Information" notes, or a
  review-only bypass. Do this or you *will* get rejected at the login wall.

---

## 4. App icon + screenshots (required assets)

- **App icon:** a 1024×1024 PNG (no alpha, no rounded corners) dropped into
  `Assets.xcassets/AppIcon.appiconset`. The slot is already configured — just add
  the image. A quick maple-leaf-on-cream mark works.
- **Screenshots:** you need 6.7" (iPhone 15/16 Pro Max) and optionally 6.5".
  Capture from a simulator or device: landing, feed card, a match, the date card,
  and the profile. App Store Connect requires at least one 6.7" set.

---

## 5. Build & upload

```bash
cd ios
xcodegen generate
# Archive for distribution (needs your signing set up):
xcodebuild -project MapleiOS.xcodeproj -scheme Maple \
  -configuration Release -archivePath build/Maple.xcarchive archive

# Then either:
#  (a) Open Xcode → Window → Organizer → Distribute App → App Store Connect, or
#  (b) xcodebuild -exportArchive with an ExportOptions.plist (method: app-store)
```

Easiest path the first time: open `MapleiOS.xcodeproj` in Xcode, select
**Any iOS Device**, then **Product → Archive**, and use the Organizer's
"Distribute App" button to upload to App Store Connect + TestFlight.

---

## 6. TestFlight first (recommended)

Before public release, add yourself and a few 5C testers via **TestFlight**. This
lets you exercise the real signup/OTP/match flow on device without going through
full App Review each time (internal testing is instant; external needs a light
review).

---

## 7. Submit for review

In App Store Connect: attach the build, fill metadata (description, keywords,
support URL, marketing URL), set price to Free, pick the US in Availability,
add the **demo account** in App Review notes, and **Submit for Review**. First
reviews typically take 24–48h.

### Common rejection reasons for dating apps (and how Maple already avoids them)
- No way to report/block → ✅ built.
- No account deletion → ✅ built.
- Reviewer stuck at a `.edu` login wall → **provide a demo account.**
- Under-declared privacy label → declare Location + Contact Info + Photos.
- Age rating too low → set 17+.
- "Spam / not enough content" (4.3) → make sure the seed feed has real-looking
  profiles with photos so the reviewer sees a working experience.

---

## Backend note for the US launch

The client is US-ready (Google Maps venues, Claremont spots, English default).
Confirm the deployed backend at `MAPLE_API_BASE` has working:
- **Resend** sender domain verified for OTP emails,
- **Twilio** US number for match SMS,
- **GOOGLE_MAPS_KEY** with Places + Static Maps enabled,
- **ANTHROPIC_API_KEY** for date planning / schedule parsing.
