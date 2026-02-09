# Backend Deployment Trigger

Last updated: 2026-02-03 16:12 IST

## Recent Changes:
- Enabled "Select Bank" for CANDIDATE signup (Enables Chat instantly)
- Fixed Chat Pipeline: Auto-add Bank Support users to new chats so they get notifications
- Fixed Candidate Profile Creation: Inherit Bank Selection correctly (Fixes "Unassigned" Chat)
- Debug Resources Role: Temporarily display role in UI to diagnose missing button.
- Added "Training Resources" management for Bank Partners
- Fixed CRITICAL bug in Client/Bank creation (Missing phone number for user)
- Fixed CRITICAL bug in User creation (Missing phone number)
- Relaxed phone validation for easier testing
- Seeded default banks (Axis, HDFC, ICICI, SBI, Kotak) to DB
- Removed fixed height from User Management table for better mobile scrolling
- Added "No Banks Found" feedback message in registration
- Fixed "Select Bank" dropdown visibility issues

- Updated Super Admin password to 6381091552
- Implemented SUB_ADMIN role with restricted access (Bank/Candidate management only)
- Fixed "Please authenticate" error on Bank Partner creation
- Updated Admin Dashboard to hide sensitive actions for SUB_ADMIN

Render should auto-deploy on push to main branch.
