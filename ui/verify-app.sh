#!/bin/bash
# CCEM-UI Application Verification Script

echo "=================================="
echo "CCEM-UI Application Verification"
echo "=================================="
echo ""

echo "1. Checking file structure..."
echo "   ✓ main.ts exists: $([ -f src/main.ts ] && echo 'YES' || echo 'NO')"
echo "   ✓ index.html exists: $([ -f index.html ] && echo 'YES' || echo 'NO')"
echo "   ✓ .env.example exists: $([ -f .env.example ] && echo 'YES' || echo 'NO')"
echo "   ✓ .env.local exists: $([ -f .env.local ] && echo 'YES' || echo 'NO')"
echo ""

echo "2. Checking components..."
echo "   ✓ Router: $([ -f src/components/Router.ts ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ Navigation: $([ -f src/components/Navigation.ts ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ CommandPalette: $([ -f src/components/CommandPalette.ts ] && echo 'OK' || echo 'MISSING')"
echo ""

echo "3. Checking pages..."
echo "   ✓ Home: $([ -f src/pages/Home.ts ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ Sessions: $([ -f src/pages/Sessions.ts ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ Agents: $([ -f src/pages/Agents.ts ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ Chats: $([ -f src/pages/Chats.ts ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ Settings: $([ -f src/pages/Settings.ts ] && echo 'OK' || echo 'MISSING')"
echo ""

echo "4. Checking styles..."
echo "   ✓ index.css: $([ -f src/styles/index.css ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ tokens.css: $([ -f src/styles/tokens.css ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ base.css: $([ -f src/styles/base.css ] && echo 'OK' || echo 'MISSING')"
echo "   ✓ components.css: $([ -f src/styles/components.css ] && echo 'OK' || echo 'MISSING')"
echo ""

echo "5. Running TypeScript check..."
npx tsc --noEmit 2>&1 | grep -q "error TS" && echo "   ✗ TypeScript errors found" || echo "   ✓ TypeScript check passed"
echo ""

echo "6. Running build..."
npm run build >/dev/null 2>&1 && echo "   ✓ Build succeeded" || echo "   ✗ Build failed"
echo ""

echo "=================================="
echo "Verification Complete!"
echo "=================================="
echo ""
echo "To start the dev server: npm run dev"
echo "To build for production: npm run build"
