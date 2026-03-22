# GATE0: Project Context

GATE0 was developed as a secure, local-first access management system for gated communities. 

### Core Objective
To provide a premium, high-security authorization flow between Residents, Visitors, and Guards without relying on external cloud services for the core logic.

### Key Milestones
- **Backend Foundation**: SQLite3 database with JWT-based authentication.
- **Mobile First**: Built with React Native and Expo, optimized for physical device testing via local IP syncing.
- **Pass Lifecycle**: Implementation of a "Generate -> Present -> Scan -> Approve/Deny" workflow.
- **QR Schema**: Implementation of a rich JSON-based QR schema to embed visitor and resident metadata directly into the scan token.
- **Security Logs**: Guard-side logging with CSV export capabilities for auditing.
