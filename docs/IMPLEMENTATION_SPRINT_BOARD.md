# CertifyPro Implementation Sprint Board

This plan translates the brainstorm into execution-ready work items.
It is grounded in the current codebase and file structure.

## 1. Delivery Goals
- Improve onboarding, trust, and user retention.
- Make async flows clearer with stronger waiting/progress UX.
- Improve upload validation and recipient parsing intelligence.
- Strengthen error feedback with actionable reasons.
- Keep cloud reliability and security posture strong.

## 2. Execution Strategy
- Sprint 1: P0 stability + core UX clarity.
- Sprint 2: P1 feature depth and quality workflow.
- Sprint 3: P2 polish, growth hooks, and analytics loops.

## 3. Dependency Order (Critical Path)
1. Shared UX primitives for loading/error states.
2. Standardized backend error envelope mapping in frontend.
3. Upload pre-validation and clear limit messaging.
4. Recipient parser intelligence v2.
5. Batch task center and progress reporting.

## 4. P0 Backlog (Must Ship First)

### P0-01 Unified async UX states
- Priority: P0
- Area: UI/UX + frontend architecture
- Files:
  - client/src/components/ui/Spinner.jsx
  - client/src/components/ui/Button.jsx
  - client/src/components/ui/Card.jsx
  - client/src/pages/templates/TemplatesPage.jsx
  - client/src/pages/templates/TemplateEditorPage.jsx
  - client/src/pages/recipients/RecipientsPage.jsx
  - client/src/pages/certificates/CertificatesPage.jsx
  - client/src/pages/emails/EmailsPage.jsx
- Estimate: 10-14 hours
- Dependencies: none
- Implementation notes:
  - Add reusable inline spinner and skeleton blocks.
  - Ensure all mutation buttons show pending state.
  - Keep page interactive while long tasks run.
- Acceptance criteria:
  - No major action appears idle while waiting.
  - Every upload/generate/send action shows immediate feedback.

### P0-02 Human-friendly error reason + next step
- Priority: P0
- Area: API UX + trust
- Files:
  - client/src/lib/api.js
  - client/src/components/ui/Alert.jsx
  - client/src/pages/verify/VerifyPage.jsx
  - client/src/pages/templates/TemplateEditorPage.jsx
  - client/src/pages/certificates/CertificatesPage.jsx
  - client/src/pages/emails/EmailsPage.jsx
- Estimate: 8-12 hours
- Dependencies: P0-01 recommended
- Implementation notes:
  - Build a small error code mapper by backend error.code.
  - Show three-part error text: what failed, why, what to do next.
  - Include optional technical details in collapsible panel.
- Acceptance criteria:
  - Error toasts/alerts include useful recovery guidance.
  - Common failures have deterministic user instructions.

### P0-03 First-time cloud hello banner (requested)
- Priority: P0
- Area: onboarding + retention
- Files:
  - client/src/components/layout/DashboardLayout.jsx
  - client/src/context/AuthContext.jsx
  - client/src/components/ui/OnboardingTour.jsx
- Estimate: 3-5 hours
- Dependencies: none
- Implementation notes:
  - Show one-time greeting after first authenticated dashboard load.
  - Message example: "Hello from <your name>. Welcome to CertifyPro Cloud."
  - Auto-disappear in 5-7s and persist flag in localStorage.
- Acceptance criteria:
  - Shown only once per user/device unless manually reset.

### P0-04 Visible upload limits + client pre-check
- Priority: P0
- Area: upload reliability
- Files:
  - client/src/pages/templates/TemplatesPage.jsx
  - client/src/pages/templates/TemplateEditorPage.jsx
  - client/src/pages/recipients/RecipientsPage.jsx
  - server/src/middleware/upload.middleware.js
  - server/src/config/index.js
- Estimate: 6-8 hours
- Dependencies: none
- Implementation notes:
  - Surface max size and accepted formats directly in UI.
  - Validate on client before upload request.
  - Keep backend limits as source of truth.
- Acceptance criteria:
  - User sees limits before selecting file.
  - Oversize/wrong-format files are blocked with clear reason.

### P0-05 Recipient parsing intelligence v2
- Priority: P0
- Area: data import quality
- Files:
  - server/src/services/file.service.js
  - server/src/utils/emailValidator.js
  - server/src/models/Recipient.js
  - client/src/pages/recipients/RecipientsPage.jsx
- Estimate: 14-20 hours
- Dependencies: P0-04
- Implementation notes:
  - Keep current case-insensitive map.
  - Add key normalization pipeline:
    - trim, lowercase, separator normalization, unicode normalize.
  - Add fuzzy alias scoring fallback for unknown keys.
  - Save mapping confidence and expose warnings in UI.
- Acceptance criteria:
  - Common uppercase/mixed keys map correctly.
  - Unknown keys provide explainable mapping suggestions.

### P0-06 Consistent error contracts for template multipart routes
- Priority: P0
- Area: backend validation
- Files:
  - server/src/controllers/template.controller.js
  - server/src/routes/template.routes.js
  - server/src/validators/template.validator.js
- Estimate: 4-6 hours
- Dependencies: none
- Implementation notes:
  - Keep safe JSON parse and schema validation path.
  - Ensure all template update/create errors return uniform shape.
- Acceptance criteria:
  - Invalid JSON or schema payload returns 422 with field-level details.

## 5. P1 Backlog (Feature Depth)

### P1-01 Task center for long jobs
- Priority: P1
- Area: operational UX
- Files:
  - client/src/pages/dashboard/DashboardPage.jsx
  - client/src/pages/certificates/CertificatesPage.jsx
  - client/src/pages/emails/EmailsPage.jsx
  - server/src/jobs/queues.js
  - server/src/jobs/email.job.js
  - server/src/jobs/certificate.job.js
- Estimate: 20-28 hours
- Dependencies: P0-01, P0-02
- Implementation notes:
  - Create a unified task model (queued/processing/succeeded/failed).
  - Expose API endpoint for recent task statuses.
  - Show progress and retry from UI.
- Acceptance criteria:
  - Batch operations are observable and recoverable.

### P1-02 Template quality assistant
- Priority: P1
- Area: generation quality
- Files:
  - client/src/pages/templates/TemplateEditorPage.jsx
  - server/src/services/template.service.js
  - server/src/validators/template.validator.js
- Estimate: 12-16 hours
- Dependencies: P0-05
- Implementation notes:
  - Validate field overlap, out-of-bound positions, tiny text, missing placeholders.
  - Add quality score and warnings before activation.
- Acceptance criteria:
  - Activation warns if template has high-risk issues.

### P1-03 Smart verification trust view
- Priority: P1
- Area: public trust UX
- Files:
  - client/src/pages/verify/VerifyPage.jsx
  - server/src/services/certificate.service.js
  - server/src/controllers/certificate.controller.js
- Estimate: 8-12 hours
- Dependencies: P0-02
- Implementation notes:
  - Show issuer info, issue timezone, revocation metadata.
  - Add copy-link/share verification CTA.
- Acceptance criteria:
  - Verification page improves confidence and readability.

### P1-04 Messaging customization expansion
- Priority: P1
- Area: communication workflow
- Files:
  - client/src/pages/emails/EmailsPage.jsx
  - server/src/services/email.service.js
  - server/src/validators/email.validator.js
  - server/src/models/EmailTemplate.js
- Estimate: 14-18 hours
- Dependencies: none
- Implementation notes:
  - Add variable checker and preview linting.
  - Support category/event-specific message variants.
- Acceptance criteria:
  - Sending blocks if required placeholders are unresolved.

## 6. P2 Backlog (Polish + Retention)

### P2-01 Typography and spacing token cleanup
- Priority: P2
- Area: design system
- Files:
  - client/src/index.css
  - client/src/components/ui/*.jsx
  - client/src/pages/**/*.jsx
- Estimate: 10-14 hours
- Dependencies: P0-01
- Implementation notes:
  - Formalize heading/body/caption scales.
  - Ensure consistent card/table rhythm and tap targets.

### P2-02 Color semantics and contrast audit
- Priority: P2
- Area: accessibility and consistency
- Files:
  - client/src/index.css
  - client/src/components/ui/Badge.jsx
  - client/src/components/ui/Button.jsx
  - client/src/components/ui/Alert.jsx
- Estimate: 8-12 hours
- Dependencies: none
- Implementation notes:
  - Standard semantic color tokens.
  - Verify AA contrast for text and statuses.

### P2-03 Engagement loops
- Priority: P2
- Area: retention
- Files:
  - client/src/pages/dashboard/DashboardPage.jsx
  - client/src/components/layout/Header.jsx
  - client/src/components/ui/OnboardingTour.jsx
- Estimate: 10-15 hours
- Dependencies: P0-03
- Implementation notes:
  - Setup checklist and completion tracker.
  - Weekly summary panel and action nudges.

## 7. What to Remove / Simplify
- Remove or archive legacy root workflow if not used:
  - server.js
- Remove duplicated UX patterns and ad hoc error rendering.
- Avoid overusing full-page loaders for button-level actions.
- Remove ambiguous CTA labels (replace "Submit" with concrete action text).

## 8. Test Matrix (Minimum)

### Backend
- Upload validation tests by file type and file size.
- Recipient parser tests for uppercase/mixed keys and fuzzy matches.
- Template create/update multipart validation tests.
- Error contract tests (field details, reason, and message consistency).

### Frontend
- Async state snapshots for all critical pages.
- Error banner/toast mapping tests with mocked API failures.
- First-time greeting appears once then disappears.
- Upload pre-check behavior for over-size and invalid formats.

## 9. Release Plan

### Release A (P0)
- Duration: 1-2 weeks
- Outcome: product feels reliable, understandable, and first-time friendly.

### Release B (P1)
- Duration: 2-3 weeks
- Outcome: stronger operational visibility and output quality controls.

### Release C (P2)
- Duration: 1-2 weeks
- Outcome: polished visual language and retention improvements.

## 10. Definition of Done
- All tickets pass QA matrix.
- No blocking console errors in normal flows.
- No ambiguous loading states for critical actions.
- Error feedback includes reason and recommended next step.
- Recipient imports handle mixed-case keys and common key variations robustly.
