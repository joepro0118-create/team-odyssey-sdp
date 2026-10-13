# AGENTS.md: Project context for AI coding agents

Read this file before writing code. It describes **what we are building and why**, plus a few firm rules. Most implementation choices are intentionally left open: the team decides them, and you should ask or propose options instead of assuming.

This file is tool-agnostic. If your tool expects another filename (for example CLAUDE.md or .cursorrules), copy the content into it.

---

## 1. What we are building

**Working name: Tolong** (Malay for "help"; the team may rename it).

A **mobile-friendly app** for a university hackathon (Sime Darby Property University Hackathon 2026, People track).

**Problem statement:** "How might we enable every resident to live healthier, safer, more connected and more fulfilling lives?"

**The idea:** a verified, township-only **marketplace where residents help each other**. Residents can ask for help, offer help, or lend things. Helpers earn **points** that can be redeemed for township rewards. A simple **management view** shows the township operator what is happening and what residents need.

**Inclusion is part of the idea:** seniors and people who are not comfortable with apps should still be able to take part, for example through a simple chatbot, a family member acting on their behalf, or township staff helping.

**Design philosophy:** useful first, social second. Many residents are private, so never force socialising.

---

## 2. This is a hackathon prototype

- The goal is a **working demo of one complete loop**, not a production system.
- All data is **simulated**. Never store real personal data.
- Prefer **simple and working** over clever and half-finished.
- Keep code easy for a small team of non-expert developers (vibecoders) to read and change.
- Build the smallest thing that makes the core loop work, then improve it.

---

## 3. The core loop (the thing that must work)

1. A resident sees what neighbours need or offer, shown in an **anonymous** way.
2. They post a request, offer, or lend listing.
3. A neighbour accepts it.
4. The exchange is **confirmed in person** in some simple, verifiable way.
5. The helper earns points and can redeem them for a reward.
6. The operator can see activity and unmet needs.

Two people on two phones should be able to complete this on a live link.

The team decides how each step is implemented. Suggest options and trade-offs before building.

---

## 4. Firm rules (do not break these)

**Privacy and safety**
- No public list of residents, and no names or unit numbers shown publicly.
- Share personal details only between the people involved in an accepted task, and keep them minimal.
- Use **fake data only**.
- Do not support prescription medicine requests in the demo. Over-the-counter items and groceries are fine.
- Show clearly that the platform connects residents and does not employ or insure them.

**Scope**
- Do not add real payments, selling goods, or paid services. Points are the only currency.
- Do not add real WhatsApp, SMS, email, or push integrations unless the team asks.
- Do not build a real integration with the Sime Darby Property App. A mock screen is acceptable.
- Do not add a daily check-in or monitoring feature. That is future work.

**Security**
- Never commit API keys, secrets, or passwords. Use environment variables and keep an example file with names only.
- Keep any AI or LLM API key on the server side only.
- Do not trust the client for sensitive changes such as points or task status.
- Turn on access rules for any database tables so data is not left open.

**Honesty**
- Anything simulated, such as users, rewards, or integrations, should be labelled as demo content in the UI.

---

## 5. Things the team has NOT decided yet

Do **not** assume answers to these. Ask, or present two or three options with pros and cons, and wait for a decision.

- Tech stack (frontend framework, backend, database, hosting)
- Data model and table design
- How in-person confirmation works (QR code, short code, something else)
- How points are earned, capped, and valued
- Which rewards appear in the catalogue
- Listing categories and templates
- Which township or area labels to use in the demo
- Visual style, colours, and branding
- Languages supported beyond English and Bahasa Malaysia
- Whether the senior chatbot, family proxy, and staff posting are built, and in what order
- App name and logo

When the team makes a decision, record it in a short `DECISIONS.md` file in the repo (one line per decision with the date) and treat it as fixed from then on.

---

## 6. Inclusion features (build only when the team says so)

These are important to the story ("every resident"), but come **after** the core loop works.

- **Senior-friendly request path:** a very simple chat or form where a senior can describe a need in Malay or English, with a clear confirmation step before anything is posted.
- **Family proxy:** a family member can create requests for a linked senior, with the senior's consent.
- **Township staff posting:** staff can post on behalf of a senior who has no family nearby.

If you build the chatbot, always show the user the interpreted request and get confirmation before posting, and validate any structured output from the model.

---

## 7. UI guidelines

- **Mobile first.** Design for a phone screen, with large touch targets and readable text.
- One main action per screen where possible.
- Keep the senior-facing screens especially simple.
- Always handle loading, empty, and error states. Never leave a blank page.
- Show a small "demo data" indicator so it is clear the content is simulated.

---

## 8. Working agreements for agents

- Ask the human instead of guessing, especially about scope, privacy, or anything in section 5.
- If a request would break a firm rule in section 4, stop and say so.
- Prefer the smallest change that works, and explain what you changed in one or two sentences.
- Do not rewrite or reformat files you were not asked to change.
- Keep related code together and use clear names so teammates (and their agents) can follow it.
- Write short comments explaining **why**, not what.
- Test important flows on a real phone browser before calling something done, and on the deployed link when one exists.

---

## 9. Definition of done

A feature is done when it works on a phone, works on the live link, handles loading and error states, does not break the core loop, and follows the firm rules above.

The MVP is done when two people on two phones can complete the core loop and the operator view reflects it.
