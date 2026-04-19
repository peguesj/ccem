# Lily AI - Phoenix Mental Health Platform

## Project Status: v1.15.1 (2026-03-30)

**Status**: Open Beta - Production Ready
**Latest Release**: v1.15.1 - Quiz System Bug Fix
**Deployment**: Live at https://lily-ai-app.yellowocean-031a09f8.eastus2.azurecontainerapps.io
**GitHub**: https://github.com/peguesj/lily-ai-phx

---

## Latest Release: v1.15.1

**Date**: 2026-03-30
**Type**: Bug Fix Release
**PR**: #64 - Quiz option selection bug fix
**Commit**: `019a3c3`

### What's Fixed
- Quiz option selection bug that always highlighted first option
- Switched from value-based to index-based option reconciliation
- Affected all assessment types: PHQ-9, GAD-7, PSS-10, Burnout, ADHD, PCL-5, ISI, SPIN, Resilience, WHO-5
- All quiz result calculations and crisis modal detection now work correctly

### Quality Metrics
- **Tests Passing**: 134/134 ✓
- **Build Warnings**: 0 ✓
- **Compilation Status**: Clean ✓

---

## Discovery Routing (v1.15.1)

Three independent pathways to therapy:

### 1. Quiz > Match (Primary)
- Users complete self-assessment quiz
- Matched with compatible therapists
- Demonstrates therapeutic fit

### 2. Directory > Group (Gated)
- Advanced therapist search and filtering
- Unlocked after quiz completion
- Browse-based discovery

### 3. Coach AI (Independent)
- 24/7 AI wellness coaching
- Crisis detection and safety checks
- No quiz requirement

---

## Key Features

### Admin Portal (15 tabs)
- Directory management, audit logs, feature flags
- Quiz builder and management
- RACI matrix, compliance tracking, support tools
- Developer panel, subscription management
- AI Research with bulk enrichment
- Style guide, asset library management

### Organization Portal
- Calendar scheduling
- Messaging system
- Directory management
- Single Sign-On (SSO)
- HIPAA compliance tracking
- Analytics and billing

### Therapist Dashboard
- Schedule management
- Availability settings
- Client roster
- Session notes
- Client inquiries

### User Dashboard
- Personalized analytics
- Messaging and notifications
- Favorites and bookmarks
- Coach AI conversations

### Public Pages
- Homepage (voice search, geolocation, advanced filters)
- Therapist directory with autocomplete
- Therapy Connect matching interface
- Quizzes (72+ self-assessments)
- Crisis support resources
- Organization invitations

---

## Technical Stack

**Backend**: Phoenix 1.8.3 / Elixir 1.19.5
**Database**: PostgreSQL
**Frontend Source**: React 18.3.1 (ported to Phoenix LiveView)
**Deployment**: Azure Container Apps
**CI/CD**: GitHub Actions

---

## Development

**Local Dev Server**: http://localhost:4010
**Getting Started**: `mix setup && mix phx.server`

---

## Next Phase: Funnel Refactor (Planning)

**Focus**: Optimize user conversion and outcomes
- Quiz > Match as primary discovery funnel
- Gate Directory access after quiz completion
- Improved user segmentation and matching accuracy

---

## Files

- **manifest.json** - Complete project metadata and feature listing
- **status.json** - Current deployment and quality metrics snapshot
- **README.md** - This file

---

**Last Updated**: 2026-03-30
**CCEM APM**: v8.10.0 (event ID: aebc3c9ed82f5d5241ff37bb5b95c8d7)
