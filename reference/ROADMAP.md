# Broseph Roadmap

High-level tracking of completed and planned work for Broseph - a group messaging app designed to help friends stay in touch.

## Vision

Broseph is the group chat you wish you had with your friends. Not a social media feed, not a broadcast channel — a **group-chat-first** experience where everything happens inside the conversations that matter. Prompts, games, reactions, and nudges all live within your group chats, making it effortless to keep the conversation going with the people you care about.

## Completed Milestones

- **001: Project Bootstrap** — pnpm monorepo, NestJS backend, React frontend, Supabase DB, Claude subagents
- **002: Initial Auth Setup** — Supabase Auth with magic links, JWT validation
- **003: MVP Group Messaging** — Groups, messages, BullMQ job queue, real-time chat
- **004: Fix Invite Links** — Token-based group invites
- **005: Realtime Updates** — Supabase Realtime for messages and members
- **006: Display Name Signup** — Display name flow during registration
- **007: Email Invitations** — Email-based invite links
- **008: Split Sign-in / Login / Signup** — Separate auth pages for sign-in vs signup
- **009: Profile Icon & Groups Menu** — User profile UI, group management
- **010: Fix Invite Flow Race Condition** — Stabilized invite acceptance
- **011: Prompts Feature Phase 1** — Daily conversation prompts, realtime feed, type safety
- **012: Comprehensive README** — Full project documentation for independent study review
- **013: Group Chat Restructure** — Pivoted to group-chat-centric design, prompts as header banner in chat
- **014: Prompt Responses in Chat** — In-chat cards, comments, reply-in-chat (iMessage-style), reply to any message, smart timestamps
- **015: Image Messaging** — Image attachments in chat, + menu, preview before send, inline rendering, full-screen expand, reply support
- **016: Multi-Image Messaging** — Up to 10 images per message, card stack UI with hover arrows, gallery modal, batch upload
- **017: Image Prompts** — Image prompt type with photo picker, image responses in banner/cards/modal, DB support for image_url

See `/milestones/` for detailed retrospectives on each.

## Upcoming Work

### In-Chat Prompts (Active)
- [x] Restructure app around group chats (remove Home feed, simplify nav)
- [x] Daily prompts appear inside group chats (header banner)
- [x] Prompt responses post as messages in the chat (special cards)
- [x] Threaded replies to prompt responses
- [x] Banner shows response content with reply counts
- [ ] Realtime updates when group members respond to prompts

### Chat Experience
- [x] Message replies to any message (iMessage-style ghost preview, scroll-to-original)
- [x] Smart conversation-start timestamps (replace per-message times)
- [x] Image messaging (+ menu, preview, inline bubbles, full-screen expand)
- [x] Multi-image messaging (up to 10 per message, card stack, gallery modal)
- [ ] Reactions and emoji support on messages
- [ ] Chat games and interactive prompts (polls, would-you-rather, etc.)
- [ ] Read receipts / typing indicators

### Engagement & Notifications
- [ ] Push notifications for new messages and prompts
- [ ] Smart nudges when a group goes quiet
- [ ] Streak tracking for group activity

### Platform Expansion
- [ ] iOS native app
- [ ] Android native app
- [ ] Web PWA enhancements

---

*Last updated: 2026-02-18*
