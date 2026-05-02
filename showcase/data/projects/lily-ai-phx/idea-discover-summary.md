# IDEA Framework Phase 1: Discover -- lily-ai-phx

**Scanned**: 2026-03-30
**Version**: v1.15.2 (Open Beta)
**Agent**: fmt-20260330-idea-reveng / Discover Agent

---

## Project Identity

**Lily** is a comprehensive mental health platform connecting users with therapists through directory search, swipe-based matching, AI coaching, and validated self-assessment quizzes. Built on Phoenix 1.8.3 / Elixir 1.19.5 with Phoenix LiveView, PostgreSQL (Ecto), and Tailwind CSS.

- **Repository**: `/Users/jeremiah/Developer/lily-ai-phx`
- **Remote**: `github.com/peguesj/lily-ai-phx`
- **First commit**: 2026-02-19 (40 days ago)
- **Total commits**: 145
- **Latest tag**: v1.15.1

---

## Architecture at a Glance

| Metric | Count |
|--------|-------|
| LiveView modules | 30 |
| Contexts (domain modules) | 19 |
| Ecto schemas | 51 |
| Controllers | 11 |
| Routes (live + non-live) | 63 |
| Database migrations | 30 |
| Elixir dependencies | 21 |
| npm dependencies | 7 |
| Test files | 13 |
| Source files (.ex + .heex) | 192 |
| Total lines of code | 36,802 |
| JS hooks | 17 |
| Seed data files | 18 |
| SVG assets | 96 |
| Lottie animations | 3 |

---

## Domain Contexts (19)

accounts, admin, ai, analytics, billing, coach, coach_ai, compliance, directory, matching, messaging, notifications, ops, organizations, practice, quizzes, research, uat, wellness

---

## User-Facing Portals (7)

| Portal | Route | Auth Level |
|--------|-------|------------|
| User Dashboard | `/dashboard` | Authenticated |
| Therapist Dashboard | `/therapist-dashboard` | Authenticated |
| Organization Portal | `/org-portal` | Authenticated |
| Admin Portal | `/admin-portal` | Admin Only |
| Coach AI | `/coach` | Authenticated |
| DevTools Panel | `/dev/panel` | Devtools-gated |
| Ops Report | `/ops` | Devtools-gated |

---

## External Integrations (10)

1. **Stripe** -- Payment processing (stripity_stripe ~> 3.2), checkout sessions, webhook verification
2. **PayPal** -- Orders API v2, OAuth token exchange, PAYMENT.CAPTURE webhook
3. **Swoosh / SendGrid** -- Transactional email, org invitations, UAT feedback
4. **Anthropic / Claude** -- AI provider for Coach AI wellness conversations
5. **SerpAPI** -- Practitioner profile enrichment and directory detection
6. **OpenStreetMap Nominatim** -- Reverse geocoding for "Near Me" search (client-side)
7. **Web Speech API** -- Voice search on homepage (client-side)
8. **Azure Container Apps** -- Production + staging hosting with ACR
9. **GitHub Actions** -- Multi-environment CI/CD pipeline
10. **Plane PM** -- Issue tracking, UAT submission sync, automated resolution

---

## Assessment Quizzes (10)

PHQ-9 (Depression), GAD-7 (Anxiety), PSS-10 (Stress), Burnout, ADHD Screening, PCL-5 (PTSD), ISI (Insomnia), SPIN (Social Anxiety), Resilience, WHO-5 (Well-Being)

---

## Background Services (GenServers)

- **DesignTokens** -- Parsed CSS/Tailwind design token server
- **UAT.SubmissionSyncer** -- Polls for new UAT submissions, syncs to Plane PM, auto-resolves on status change

---

## Feature Inventory (40 features)

1. Therapist directory with search, filters, profile pages
2. Therapy Connect swipe matching (spring physics, super like, undo)
3. Coach AI wellness chatbot with crisis detection (19 keywords, 4 crisis resources)
4. 10 validated mental health assessment quizzes
5. Quiz-to-Match funnel gating (quiz completion required for directory access)
6. PERMA-V analytics engine with radar charts
7. User dashboard (journal, mood logging, goals, saved therapists)
8. Therapist dashboard (schedule, client roster, session notes)
9. Organization portal (seat management, analytics, SSO, compliance)
10. Admin portal (15+ management tabs)
11. Real-time messaging via PubSub
12. Stripe + PayPal dual payment processing with webhooks
13. 2FA/TOTP enrollment with QR codes and backup codes
14. RBAC with admin-only live session guard
15. Feature flags with conditional rules, rollout %, role/plan targeting
16. CMS pages with TipTap WYSIWYG editor
17. Quiz builder with drag-and-drop question ordering
18. Quiz JSON import (drag-drop uploader)
19. Subscription billing with tier-based feature gates
20. Compliance audits and findings tracking (HIPAA)
21. Notification tray with PubSub real-time updates
22. Organization invitation system (token-based email flow)
23. Voice search via Web Speech API
24. Near Me geolocation via Nominatim reverse geocoding
25. Advanced search with autocomplete and filter chips
26. AI practitioner research (SerpAPI enrichment + directory detection)
27. Profile view toggle (Standard vs AI Enhanced)
28. Neobrutalist Therapy Connect card design
29. Lottie animations (welcome, success, loading)
30. Visual style guide at /style-guide with design tokens
31. UAT testing framework (test cases, bug reports, user stories, OTP auth)
32. UAT submission syncer (GenServer, Plane PM integration)
33. Dev tools widget (changelog, seed inspector, org tree)
34. Ops report page for product strategy
35. Crisis support page with emergency resources
36. Blog, How It Works, Pricing pages
37. Demo mode with is_demo flag filtering
38. Glassmorphism CSS utilities
39. Responsive navbar with mobile hamburger menu
40. Showcase modal with localStorage dismissal

---

## Version History

- **30 changelog versions** from v1.0.0 (2024-12-01) to v1.15.2 (2026-03-30)
- **26 phases shipped** through the development lifecycle
- Progressed from Prototype (v1.0.0) to PoC (v1.1.0) to Open Beta (v1.14.0)

---

## Deployment

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | lily-ai-app.yellowocean-031a09f8.eastus2.azurecontainerapps.io | main |
| Staging | lily-ai-app-staging.gentletree-f65e7f15.eastus2.azurecontainerapps.io | develop |

**CI/CD**: GitHub Actions (build -> migrate -> deploy -> health check)
**ACR**: lilyaiphxacr.azurecr.io (production), lilyaistaging.azurecr.io (staging)

---

## Key Technical Decisions

- **Phoenix LiveView** for all interactive pages (no separate SPA; server-rendered with WebSocket interactivity)
- **Single-file LiveView pattern**: `index.ex` + `index.html.heex` per portal
- **Tab switching via `@active_tab` assign** with `handle_event("switch_tab", ...)` for portal navigation
- **Binary ID primary keys** on most schemas, bigint on users table
- **Seed architecture**: orchestrator at `priv/repo/seeds.exs` with 18 individual seed files
- **JS hooks** for rich client-side behavior (TipTap, Lottie, swipe physics, search enhancements, UAT widget)
- **lottie-web** (not lottie-react) via `LottiePlayer` hook pattern
- **ARM64 Docker builds only** (QEMU emulation segfaults with OTP 27 JIT on amd64)

---

*Generated by IDEA Framework Discover Agent -- fmt-20260330-idea-reveng*
