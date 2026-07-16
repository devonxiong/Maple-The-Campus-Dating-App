#!/bin/bash
# Build Maple and launch it in the iOS Simulator — no signing / Team ID needed.
# Usage:  cd ios && ./run-sim.sh
set -e

cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:$PATH"

echo "🍁 Generating Xcode project…"
xcodegen generate >/dev/null

# Pick (or create) an iPhone simulator.
DEVICE_NAME="iPhone 16 Pro"
RUNTIME=$(xcrun simctl list runtimes | grep -i "iOS" | tail -1 | grep -oE 'com.apple.CoreSimulator.SimRuntime.iOS[^ ]*' || true)
UDID=$(xcrun simctl list devices | grep -i "$DEVICE_NAME (" | grep -oE '[0-9A-F-]{36}' | head -1 || true)
if [ -z "$UDID" ] && [ -n "$RUNTIME" ]; then
  echo "📱 Creating simulator: $DEVICE_NAME"
  UDID=$(xcrun simctl create "$DEVICE_NAME" "iPhone 16 Pro" "$RUNTIME")
fi
if [ -z "$UDID" ]; then
  echo "❌ No iOS Simulator runtime found. Run:  xcodebuild -downloadPlatform iOS"
  exit 1
fi

echo "🔨 Building for simulator…"
xcodebuild -project MapleiOS.xcodeproj -scheme Maple \
  -sdk iphonesimulator -configuration Debug \
  -destination "id=$UDID" \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO build >/dev/null

APP=$(find build/Build/Products -name "Maple.app" -type d | head -1)
echo "🚀 Booting simulator + installing $APP"
open -a Simulator
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" ai.maplemeet.app
echo "✅ Maple is running in the Simulator."
