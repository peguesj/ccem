#!/bin/bash
# Build CCEMHelper as a proper macOS .app bundle
set -euo pipefail

cd "$(dirname "$0")"

echo "Building CCEMHelper..."
swift build -c release 2>&1

APP_DIR=".build/CCEMHelper.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"

rm -rf "$APP_DIR"
mkdir -p "$MACOS" "$CONTENTS/Resources"

cp .build/release/CCEMHelper "$MACOS/CCEMHelper"
cp Resources/Info.plist "$CONTENTS/Info.plist"

echo "Built: $APP_DIR"
echo "Run: open $APP_DIR"
