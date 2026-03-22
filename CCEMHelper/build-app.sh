#!/bin/bash
# Build CCEMAgent as a proper macOS .app bundle
set -euo pipefail

cd "$(dirname "$0")"

echo "Building CCEMAgent..."
swift build -c release 2>&1

APP_DIR=".build/CCEMAgent.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"

rm -rf "$APP_DIR"
mkdir -p "$MACOS" "$CONTENTS/Resources"

cp .build/release/CCEMAgent "$MACOS/CCEMAgent"
cp Resources/Info.plist "$CONTENTS/Info.plist"

echo "Built: $APP_DIR"
echo "Run: open $APP_DIR"
