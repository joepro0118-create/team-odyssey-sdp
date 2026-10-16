# Tolong design notes

Source: [concept.html](./concept.html) (Claude Design export). Unpacked screens live in [extracted/](./extracted/) (`*_rendered.html` files are the readable markup).

**Fidelity target:** about **90% match** to the design. This is what we imagine residents will see. Only spacing/sizes adapt to real devices, and all sample content is replaceable.

**How to use the design:** treat it as a **style guide and flow reference**, not a pixel-perfect blueprint. The screens are static mockups at 390×844. Match the look, the components, the screen order and the privacy rules. Spacing and sizes can adapt to real devices.

## What to follow closely

### Flow (in order)
1. Home feed
2. New post
3. Request details (with an Accept button)
4. My activity (my requests and my tasks)
5. Show QR code
6. Handover confirmed
7. Rewards

Extra states for Home: loading, empty, error.

### Look
| Item | Value |
|---|---|
| Red (primary) | `#C8102E` |
| Orange (fade step) | `#E8602A` |
| Yellow (accent) | `#FFC72C` |
| Ink (text) | `#1B1416` |
| Muted text | `#6B6063` |
| Page background | `#EFEDEB` (warm grey, not white) |
| Cards | white, 20px radius |
| Buttons and chips | pill shape (fully rounded) |
| Font | Montserrat (500, 700, 800) |
| Top band | red fading to orange then yellow (115°), 16px rounded bottom corners |

The red and yellow codes are approximations of Sime Darby's brand colours, and Montserrat is a stand-in for their font. Replace them with the official values if you have them.

### Components
- **Tab bar:** five slots: Home, Activity, Post (raised yellow circle in the middle), Rewards, Profile. The active tab has a red-to-orange gradient.
- **Post tags:** Request (red text on pale red), Offer (pale yellow), Lend (warm grey). Tags stay soft, and points stay solid.
- **Points chip:** solid yellow with dark text.
- **Primary button:** red-to-orange pill with white text. The Post button is yellow with dark text.
- **Back button:** white circle with a red arrow, top left on detail pages.

### Rules (keep these)
- The feed shows **precinct only**: no names and no unit numbers.
- A poster's first name and a **Verified** tick appear on the request page.
- A **unit number is shared only after someone accepts**, and only with that person.
- Handover is confirmed by a **QR scan** from both sides.
- Rewards focus on real local perks, and points stay small.

## What is flexible
- Exact spacing, sizes and screen widths.
- **All sample content:** names, units, tasks, vouchers, prices and point values. None of it is final.
- The illustrations (tick badge, error and empty icons). Replace them with your own artwork.
- Hex codes and font (see above).

## If a screen is missing from the design or the app
- **In the design but not in the app yet:** build it using the same components.
- **In the app but not in the design** (for example the Profile page): build it from the same cards, buttons and tab bar. Do not invent a new look.
- **Not needed for the MVP:** skip it and say so in the brief.

## Short version to send
> Use the design as a style guide and flow reference. Match the colours, font, components, screen order and privacy rules. Spacing can adapt to real devices, and all names, points and vouchers are sample data. Anything missing from the design should reuse the same components.
