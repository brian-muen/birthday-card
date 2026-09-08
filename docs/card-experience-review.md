# Card experience review

## Scope

Four feature branches target `codex/card-experience`, based on the existing `frontend-iteration` checkout. The final integration review targets `frontend-iteration` to avoid silently publishing unrelated work already present on that branch. Production deployments and Slack messages are outside this review.

## Manual acceptance matrix

- Homepage: edit name and stock; preview matches; narrow-screen form and preview remain usable; creation action preserves entered values on validation errors.
- Card: zero, one, odd and even note counts; all pen styles; 80-character name; 2000-character message.
- Navigation: opening, next/previous, rapid repeated inputs, reversing during motion, close/reopen, first and final spread.
- Responsive: 375px mobile and desktop; resize while reading preserves a visible message; vertical scrolling is not consumed by swipe navigation.
- Accessibility: keyboard-only reading, no hidden-page tab stops, meaningful status messages, reduced motion and accessible expanded reading.
- Signing: draft survives reload and stays scoped to one card; preview matches submitted content; failure preserves text; success clears the draft; storage failure does not prevent signing.
- Organizer: distinguish contributor, recipient and private organizer links; count matches contributions; copy fallback offers selectable text; no accidental Slack send; recipient views expose no organizer actions.

## Verification results

To be filled after integration. Screenshots and browser observations must be from the integrated worktree, not assumed from independent branch checks.
