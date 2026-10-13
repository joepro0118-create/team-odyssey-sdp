# Team Brief: Sime Darby Property University Hackathon 2026 (People Track)

*Working name: **Tolong** (rename it if you like). Internal brief so every teammate knows what to do.*

## 1. Goal

Win the People track by building a working prototype of a **township marketplace where residents help each other**, and pitching it well.

**Key dates** (verify on the official page): register by **21 Oct**, proposal due **23 Oct**, Top 10 announced **28 Oct**, mentoring **2-6 Nov**, final submission **11 Nov**, pitch day **14 Nov**.

**Problem statement:** "How might we enable every resident to live healthier, safer, more connected and more fulfilling lives?"

## 2. What we're building

A verified, township-only marketplace where any resident can **ask for help, offer help, or lend things**, and earn points for contributing. Points can be redeemed for township rewards (mall parking or vouchers, facility credits, tree planting). It is designed so that **everyone can take part**, including seniors and people who aren't comfortable with apps, through a chatbot, a family proxy, or township staff.

Sime Darby sees activity and unmet needs on a simple dashboard.

**One-liner:** *A verified township marketplace where neighbours help each other and get rewarded, built so every resident can take part.*

## 3. Why this idea (everyone should be able to explain this)

- People need small things all the time: a lift, a parcel pickup, a borrowed tool, help with a phone. Neighbours could help, but there's no easy, trusted way to ask.
- Existing property apps cover gates, bills, and complaints. None help residents help each other.
- Facebook groups and Carousell exist, but they aren't verified, aren't limited to the township, and offer no township rewards.
- Many people are private, so we don't force socialising. It's useful first and social second.
- Rewards bring residents to Sime Darby retail, and the data shows what residents need.
- Seniors and non-app users are included by design, which answers "every resident."

**Note:** these are our assumptions, backed by sourced research where we have it. We don't claim resident evidence we haven't collected. The pilot is where we would test them.

## 4. Who uses it

| User | What they do |
| --- | --- |
| **Any resident** | Posts requests, offers help, lends items, earns and redeems points |
| **Seniors** | Use a simple chatbot to make requests |
| **Families** | Post requests on behalf of a parent who isn't comfortable with apps |
| **Township staff** | Post requests for seniors who have no family nearby, and seed the marketplace |
| **Sime Darby** | Views the management dashboard |

## 5. What the marketplace includes

**In the MVP**

1. **Requests:** "Need a ride to the clinic," "parcel pickup," "help with a phone"
2. **Offers:** "I can tutor maths," "I can help set up phones," "I can water plants"
3. **Lend and borrow:** "Drill available," "need a baby carrier"

**Later or only mentioned:** swaps and giveaways, community events, a community fund.

**Not doing:** real payments, selling goods, paid services, or anything that makes us a commercial marketplace. Points are the only currency.

## 6. The one flow we must get working

1. A resident opens the marketplace and sees anonymous, block-level cards (for example "Parcel pickup, near Block B").
2. They post a request or offer from a template in about ten seconds.
3. A neighbour accepts. First names and contact details are shared for that task only.
4. At handover, both confirm, and the **QR scan** verifies the exchange happened in person.
5. The helper earns points and redeems a reward.
6. The management dashboard shows activity, popular categories, and unmet needs.
7. **Inclusion moment (the "every resident" proof):** a senior makes the same request through the chatbot ("Saya nak beli ubat"), and a family member makes one on their behalf.

If this loop works end to end on a live link, we have a demo.

## 7. Scope

**Must have**

- Marketplace feed with requests, offers, and lend/borrow, with categories
- Post, accept, and complete flow
- Anonymous, block-level area view (no public names or unit numbers)
- QR generate and scan for handover
- Points and a simple reward screen
- Management dashboard (one screen)

**Inclusion module (build after the main loop works)**

- Senior chatbot (Malay and English) that turns text into a structured request
- Family proxy account linked with the senior's consent
- Township staff posting on behalf of a senior

**Nice to have**

- Ratings and report button
- Voice input
- Mandarin and Tamil
- "No points, just thanks" option for lending and giveaways

**Not doing**

- Real payments, WhatsApp or SMS integration, or real Sime Darby app integration (we mock it)
- Prescription medicine (over-the-counter items and groceries only)
- Any public resident list

## 8. Who does what

| Person | Owns | First tasks |
| --- | --- | --- |
| **Leader** | Scope, proposal, pitch story, merges | Read the official brief, register the team, write the proposal outline |
| **Member 2** | Research, pilot plan, proposal support | Competitor scan (JaGaApp, iNeighbour, Facebook groups, Carousell), verify facts from the Gemini report against official sources, draft pilot plan, KPIs, and reward cost estimate |
| **Member 3** | Marketplace feed, post and accept flow | Feed UI, templates, request and offer creation |
| **Member 4** | Backend, QR, points, rewards | Database, QR generate and scan, points logic, reward screen |
| **Member 5** | UI design, dashboard, deck, demo video | Wireframes for 3 screens, management dashboard, pitch deck |
| **Shared (Member 3 and 5, then all)** | Inclusion module | Senior chatbot and family proxy, after the main loop works |

Each person works on their own area and branch.

## 9. How we work

- **One GitHub repo**, one branch per person, small merges daily.
- **A shared context file in the repo** (stack, folder structure, conventions) so everyone's AI tools produce consistent code.
- **Stack:** pick one frontend framework and one backend or database service on day 1. Everyone uses the same.
- **Deploy early** and keep a live link.
- **Simulated data is fine**, but label it honestly.
- **Daily 15-minute check-in:** what I finished, what's next, what's blocking me.
- **One task board** with a named owner on every task.
- The leader makes the final call on scope disagreements after hearing everyone.

## 10. Timeline

| Dates | Focus |
| --- | --- |
| **11-12 Oct** | Agree scope, set up repo and board, pick stack, read the official brief, confirm everyone is eligible (currently enrolled in a Malaysian university) |
| **13-15 Oct** | Wireframes, skeleton app running end to end, competitor scan |
| **16-19 Oct** | Build the core marketplace loop, draft the proposal |
| **20 Oct** | Team reviews and challenges the proposal |
| **21 Oct** | **Register** |
| **22-23 Oct** | Polish and **submit early on the 23rd** |
| **24-27 Oct** | Rest, tidy code, improve the demo |
| **28 Oct-1 Nov** | If Top 10: build the full loop plus inclusion module |
| **2-6 Nov** | Mentoring sprint: act on feedback, test the prototype with friends |
| **7-9 Nov** | Feature freeze about 8 Nov, bug fixes, deploy, record a fallback demo |
| **10-11 Nov** | Final submission |
| **12-14 Nov** | Rehearse the pitch at least three times |

## 11. What "done" means

- A person can go through the full loop on a live link without help.
- The main flow has no broken screens.
- We know which parts are simulated and say so honestly.
- In one minute, anyone on the team can explain: the problem, the user, how it works, why Sime Darby would want it.

## 12. How we answer the judges

| Criterion | Our answer |
| --- | --- |
| Impact (25%) | Clear target group, measurable KPIs, sourced research, seniors included |
| Innovation (20%) | Verified township-only marketplace, QR-verified handover, points tied to township rewards, built for non-app users |
| Feasibility (20%) | Small core loop, one-township pilot plan, designed to plug into the existing Sime Darby app |
| Strategic fit (15%) | Liveable townships, community wellbeing, tree-planting reward |
| Commercial (10%) | Rewards drive retail footfall, dashboard shows unmet needs, scalable across townships |
| Team and pitch (10%) | Competitor research, working demo, pilot plan |

**Questions we must be ready for**

- *Why not just use Facebook groups or Carousell?* Verified residents only, hyper-local, township rewards, and inclusive for non-app users.
- *Why will people keep using it?* Convenience, useful help, real rewards, and seeded activity from the start. We state this as an assumption the pilot would test.
- *Who pays for the rewards?* Retail marketing budget, partners, or sustainability budget, with a per-resident cost estimate.
- *Is it safe?* Verified residents, low-risk categories, handover at the door or common areas, mutual confirmation, ratings, and a report button.
- *Can people cheat?* Daily point caps, QR handover, and limits on repeated pairs.
- *Privacy?* Opt-in, minimal data, no public names or unit numbers.

## 13. Pilot plan (a proposal for the pitch, not something we run now)

The pilot is a plan that shows judges the idea is realistic. We present it in the proposal and on one slide. We only build the prototype.

- **Where:** one township (Elmina for an active, family community, or Bukit Jelutong for a senior focus).
- **Length:** 90 days.
- **Seeding:** township staff and the residents' association post the first requests and offers.
- **KPIs:** weekly active users, requests fulfilled within 24 hours, voucher redemptions per month.
- **Cost:** estimate reward value per active resident per month.
- **What it would test:** whether residents will help each other for township rewards, which categories are most used, and whether seniors take part through the chatbot or family proxy.

## 14. Be careful about

- **Privacy:** no public names or unit numbers, opt-in only, collect minimal data.
- **Safety:** verified residents only, low-risk tasks, handover at the door.
- **Fairness:** daily point caps and limits on repeated pairs.
- **Medicine:** demo only over-the-counter items or groceries.
- **Mall voucher:** a proposal, not a confirmed partnership, so don't state it as fact.
- **Liability:** state that the platform connects residents and does not employ or insure them.
- **Evidence:** never present a guess as something residents said, and never make up quotes or numbers.
