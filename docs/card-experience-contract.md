# Card experience contract

Direction: a folded birthday card on a quiet tabletop. Retain existing serif and handwriting fonts. Palette: tabletop #fafaf7, liner #fffdf8, ink #1b2440, muted #59617a, rule #dedcd4, accent #7c5416; covers retain stock choices. Left-aligned controls, centered physical card, clear mobile layout. Realism comes from subtle grain, paper edges and light, with no decorative motion unrelated to user actions.

Ownership: paper agent owns app/page.tsx, new homepage components, app/paper.css and general visual tokens in globals.css. Motion agent owns card-book.tsx and app/card-motion.css; may remove the old card CSS block from globals.css but coordinate with paper agent and avoid editing its base tokens. Signing agent owns signing route, message form and independent reading component if needed; do not edit card-book.tsx. Organizer agent owns created route and copy/share components. Root integrates imports and reading component and resolves any overlaps.

Keep CardBook public props compatible. Do not change DB schema, add dependencies, alter API permission semantics, or send Slack messages. Private messages are visible to recipient and organizer, not other contributors. Delivery occurs when the recipient link is shared; no timed gate exists. Signers must never gain access to other notes.

Motion: 700–850ms opening, 450–600ms page turns, 600–750ms closing. One transition in flight, at most one queued action. Stable message position through resize. Close returns to front. Reduced motion uses instant changes. Hidden faces inert; keyboard focus remains useful. Touch gestures must preserve vertical scrolling.

Paper shared API: .paper-surface for a subtly textured writing sheet, --paper-liner for interior, --card-stock for chosen cover. Motion stylesheet owns card geometry, transforms, animated shadow/crease only. Paper may style static card materials via .card-face/.card-panel but communicate exact rules.

Validation: lint, type checking/build as feasible; report actual checks. Browser scenarios: empty, single, many, long note (2000 chars), 80-char name, all pens; 375px and desktop; rapid next/previous, close/reopen, keyboard, reduced motion, resize, draft recovery, failed submission. No production mutations for testing. Preserve faith dedication on recipient cover.

Each agent: work only in assigned worktree; read AGENTS.md and relevant installed Next docs before code. Use frontend-design skill for visual work. Commit, push branch, create draft PR targeting codex/card-experience. PR body should explain behavior, validation, limitations. Do not merge. Do not modify unrelated user work. Review work for regressions before reporting completion.
