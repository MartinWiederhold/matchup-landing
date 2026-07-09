# Designing a Rating, Trust & Anti-"Dating-App" System for a Tennis/Racket-Sports Matchmaking App

## TL;DR
- **Don't copy Uber's 5-star average — it inflates to uselessness.** Filippas, Horton & Golden ("Reputation Inflation," NBER Working Paper No. 25857, 2019) found "the fraction of workers receiving a perfect 5-star rating grew from 33% to 85% in just 6 years" on a large online labor market; per Athey, Castillo & Chandar (2019), "Almost 90% of UberX trips are rated at the maximum of five stars." Instead separate two things: an objective, results-based **skill rating** (UTR/Elo-style, updated per match) and a lightweight **trust/behavior layer** built on tags/badges plus a private "would you play again?" signal — not a public star average.
- **Kill the dating-app perception through interaction design, not just color.** The swipe-match pattern is proven for non-dating (Bumble BFF, Bumble Bizz, Shapr), but the apps that succeed replace one-on-one "match" mechanics with activity-first flows (browse open games, "Ask to join," group chats, session logistics), foreground skill/logistics data over headshots, and use verification + reporting to police romantic misuse.
- **Trust comes from verification + accountability, not reviews alone.** Phone/ID verification, skill verification via actual match results, deposits/no-show penalties (Booksy reports providers had "20% fewer cancellations" a month after enabling no-show protection), and a private candid-feedback channel (private feedback is far more honest than public) will do more than a public star score.

## Key Findings

### 1. The rating problem: star averages die of inflation
The single most important research finding for this app is that **public 5-star averages inflate until they carry almost no information.** In Filippas, Horton & Golden's study of a large online labor marketplace, the share of workers receiving a perfect rating rose from 33% to 85% in just six years, and the authors estimate that the majority of that rise (their point estimate is 67.7%, with a robustness check of 56.6%) is due to inflation rather than genuine quality improvement. The average feedback score rose from 3.74 in early 2007 to 4.85 in May 2016. The mechanism is emotional: as the authors put it, "raters feeling pressure to leave 'above average' ratings… This pressure stems from raters' desire to not harm the rated seller. As the potential to harm is what makes ratings effective, reputation systems, as currently designed, sow the seeds of their own irrelevance." Uber, Airbnb, and the studied labor market all show ratings pooled near the ceiling.

The design implication: a public star average for *players rating each other* will collapse to "everyone is 4.8–5.0" and stop discriminating between good and bad partners — exactly when a newcomer most needs the signal.

### 2. How the benchmark systems actually work
- **Uber** — two-sided, 1–5 stars, anonymous, averaged over the last 500 trips. Ratings below 5 force a reason from a dropdown; "out of your control" reasons (traffic, app issues) are filtered out by Ratings Protection. Industry sources (Ridester, ComputerCity, citing Uber) put the average rider rating near 4.89 and the driver deactivation threshold around 4.6 — figures Uber does not officially publish uniformly and which vary by city. Crucially, Uber **layered tags/badges on top**: after a 5-star rating riders can give "Compliments" — a fixed set of ~9 badges ("Great Conversation," "Cool Car," "Above and Beyond," "Excellent Service") that tell the driver *what* they did well. Uber Eats uses **thumbs up/down (100%/0%)** plus compliment/improvement tags rather than stars for items and delivery.
- **Airbnb** — two-sided, **double-blind**: neither party sees the other's review until both submit or 14 days pass, which structurally prevents retaliation. Sub-category star ratings (cleanliness, accuracy, communication, check-in, location, value; overall is a separate category, not an average). Guest-side ratings are shown to hosts as **check-marks (4–5) or warning icons (1–3)**, not raw numbers. "Would host again" is a norm in the written review.
- **UTR (Universal Tennis Rating)** — the gold standard for skill: a modified-Elo, **results-based** 1.00–16.50 scale computed from actual match scores (margin matters, not just win/loss), a "weighted average of up to 30 of their most recent match ratings" within the last 12 months, recalculated daily. One match yields a *projected* rating; after approximately five matches it becomes *reliable*. A blue-check **Verified UTR** exists for high-stakes use (college recruiting). Withdrawals before four games are played don't count, discouraging gaming. Per Universal Tennis/Wikipedia, "The UTR database includes results from more than 8 million matches and 200+ countries. More than 800,000 players have UTRs."
- **RacketPal** — closest analog: finds local tennis/badminton/squash/padel/table-tennis partners, in-app chat, group chat, "Ask to join" public games, leagues, court booking. Uses AI that **updates skill level from recorded match scores** rather than relying on self-rating, and added **phone verification for newly onboarded users** as a safety feature. Raised €450K from Neogen Capital; ~10,000 users organizing 5,000+ matches at the time of that raise.
- **TennisPAL** — find players/courts, broadcast to nearby players, flex leagues ($39/season, $24 for subscribers). Its documented weakness is instructive: **self-rated skill levels are unreliable** — App Store reviewers complain that self-described 4.5s often play like 3.0s, "a gross overestimation."
- **PlayYourCourt** — assigns an initial PYC rating from a self-assessment quiz, then adjusts it as you play to keep pairing you with evenly matched players; its terms explicitly prohibit taking players off-platform.

### 3. The "dating app" perception is real and solvable
In designer Nick Calhoun's Bumble BFF redesign case study, "During usability tests, users continually expressed that BFF felt like a dating app, specifically citing the profile layout and swiping feature." Shapr's CMO Vincent Bobin framed the core challenge identically: "The challenge for Shapr is to clarify that we are a networking app and not an app for romantic relationships." So the swipe/match pattern *works* for non-dating (Shapr generated millions of professional matches; Bumble spun BFF into its own standalone app) but it *carries* dating connotations that must be actively countered.

What the successful non-dating apps did:
- **Bumble BFF/Bizz**: separate profiles per mode, distinct color (BFF/Bizz moved to **blue** vs Date's yellow), interest/hobby-first profiles, either party can open a conversation in BFF, and eventually a **fully separate app** built around **group chats and events** (many-to-many, not one-to-one).
- **Shapr/Lunchclub**: **goal selection** on entry ("find a new job," "make friends," "hire talent," "find mentors"), profiles autofilled from LinkedIn (job title, experience) rather than photos, and **moderation/flagging** of anyone pursuing dating or hard-selling.
- **Design signals**: dating apps lean on large prominent photos, warm/passionate palettes (Tinder pink; red/coral evokes passion), playful gamified swiping, and "It's a Match!" celebration screens. To read as *sport/professional*, invert those: lead with **skill level, availability, home courts, and stats**; use a cooler, athletic palette (blues, greens, court-inspired tones — the direction Bumble itself took to signal "not the same Bumble") rather than pink/red; make the primary object an **activity/session** ("open hit Saturday 9am, NTRP 4.0, needs 1") rather than a person; and replace the mutual-match dopamine screen with a **booked-session confirmation**.

### 4. Trust & safety for meeting strangers to play
- **Skill verification**: don't trust self-rating (TennisPAL's cautionary tale). Derive skill from recorded results like UTR/RacketPal; let new users self-estimate but mark it "unverified/provisional" until enough logged matches confirm it.
- **Identity verification**: phone verification (RacketPal's approach) for everyone; optional ID/photo verification with a visible badge (the pattern used across dating and marketplace apps) raises trust without forcing everyone through friction.
- **Background checks**: full criminal background checks (NCSI, JDP, Checkr, Player's Health) are standard in *youth* sports where adults access minors — NCSI reports finding "46% more criminal records than database-only searches," and checks run roughly $10–$40. This is likely overkill and friction-heavy for adult peer play, but worth offering as an optional trust badge and making mandatory for anyone coaching juniors.
- **No-shows**: the biggest peer-play trust killer. Booking platforms cut no-shows with **deposits, cancellation windows (24–48h is the industry standard), card-on-file no-show fees, automated reminders, waitlists, and "trusted client" status** that exempts reliable users. Booksy states providers had "20% fewer cancellations" a month after enabling no-show protection, with no significant drop in bookings; the industry aims to keep no-show rates below the 10–15% norm. Track a **reliability/attendance rate** and restrict repeat offenders (e.g., after N no-shows, booking privileges limited to walk-in/last-minute).

### 5. Rating mechanics that resist inflation
- **Double-blind reveal** (Airbnb model) reduces retaliation. In Fradkin, Grewal & Holtz's Airbnb field experiment ("Reciprocity and Unveiling in Two-Sided Reputation Systems," *Marketing Science*, 2021), hiding reviews until both parties submitted *increased* review rates (+1.7% guests, +9.8% hosts), decreased the guest–host rating correlation by 48%, and made ratings only marginally lower (average guest rating just 0.25% lower). Note the earlier NBER working-paper version reports the negativity effect as roughly a 1.6-percentage-point drop in five-star reviews — same direction, small magnitude.
- **Private candid channel**: private feedback is dramatically more honest than public. In the reputation-inflation study, among employers who privately said they'd definitely *not* rehire a worker, 28.4% still publicly gave more than 4 stars. Collect a private "would you play again?" that feeds matching quietly, rather than a public average that inflates.
- **Binary over stars**: a "Would you play them again? Yes/No" metric (NPS-style, or thumbs up/down like Uber Eats) is simpler, less prone to ceiling compression, and directly answers the only question that matters for rematching.
- **Tags over scores** for behavior: Uber-style positive badges ("On time," "Great rallies," "Good sportsmanship," "Friendly," "Accurate skill level," "Would recommend") give actionable signal, feel encouraging (reducing the awkwardness of rating a peer), and avoid a punishing public number.
- **Handling new users**: borrow UTR's projected-vs-reliable framing — show provisional status and a confidence indicator rather than an empty or scary zero. Marketplace research on "prior-weighted" rating design shows platforms can tune prior strength to protect new entrants (individual fairness) at some cost to how fast the system learns true quality — a deliberate, adjustable trade-off.
- **Minimum reliability**: UTR treats ~5 matches as the reliability threshold; don't surface a "reliable" rating before then.

### 6. Cadence, incentives, gamification
- **Rate after every session** (like Uber per-trip and UTR per-match) but keep it to one tap (thumbs + optional tags), and **gate the next booking on completing the last rating** — Uber's proven trick for maintaining response rates (riders are prompted to rate before they can book again).
- **Incentivize participation, not positivity** — the US FTC prohibits conditioning rewards on the review being positive ("If you offer an incentive for a review, don't condition it… on the review being positive"). Reward *completing* ratings with points/badges/streaks. Note the tension: incentives raise volume but can skew positive, worsening inflation, so favor non-monetary recognition and route candor to the private channel.
- **Gamification that fits sport**: streaks (RacketPal users report playing many consecutive days after downloading), achievement badges for matches played, level-up as verified rating climbs, league leaderboards, sportsmanship recognition. These map naturally onto athletic motivation without feeling like a dating game.

## Details

**Recommended architecture — three separate layers, never merged into one public star average:**

1. **Skill layer (objective, public):** a UTR/Elo-style number derived from recorded match results. This is your matching backbone and the single most credible trust signal — it's factual, self-correcting, hard to fake, and the reason UTR is trusted by college coaches. Show "provisional" until ~5 matches are logged.

2. **Reliability layer (behavioral, semi-public):** attendance/punctuality derived from confirmed sessions and no-show records, shown as a badge or percentage, backed by deposit/cancellation mechanics. This is what makes strangers comfortable committing to a session.

3. **Compatibility layer (social, mostly private):** double-blind, one-tap "Would you play again? Yes/No" plus positive tags. Feeds matching and surfaces a "recommended by players like you" signal, but is **not** shown as a raw public average, avoiding the inflation death-spiral.

**On the dating-app perception specifically:** the fastest de-risking move is to make the home screen an **activity feed of open games/sessions** rather than a stack of faces to swipe. RacketPal's "Ask to join" and group-match model, Bumble BFF's shift to group chats and events, and Shapr's goal-first onboarding all point the same way: reduce the one-to-one, appearance-led, mutual-crush framing and emphasize many-to-many, skill-and-logistics-led framing. Keep photos (people want to recognize their partner and court) but make them secondary to level, availability, and home venue. Use explicit intent selectors ("practice/hitting partner," "competitive match," "doubles partner," "tour/travel hitting") the way Shapr and Bumble use goals. Add visible moderation and one-tap reporting of romantic advances, as Shapr did.

## Recommendations

**Stage 1 — MVP (launch):**
- Ship the **skill layer** first (results-based rating, provisional→reliable), since bad skill matching is TennisPAL's #1 complaint and is your core value proposition.
- Home screen = **open-games activity feed + search by level/location/availability**, not a swipe deck. This alone defuses most of the dating-app perception.
- Phone verification for all; **one-tap post-session feedback**: "Would you play again? 👍/👎" + a small set of positive tags; gate the next booking on completing it.
- Cooler athletic visual identity (court blues/greens), skill/availability-forward profile cards.

**Stage 2 — trust hardening (once you have session volume):**
- Add **double-blind reveal** and a **private "would you play again"** signal separate from anything public.
- Introduce **no-show protection**: a cancellation window, optional deposits for booked sessions, automated reminders, waitlists, and a visible **reliability %**; add a "trusted player" exemption for reliable users.
- Optional **ID-verified badge**; mandatory background check only for anyone offering coaching to minors.

**Stage 3 — engagement & scale:**
- Gamify: streaks, matches-played badges, league leaderboards, sportsmanship recognition.
- Add group/community features (club chats, events) to lean further away from one-to-one dating optics and toward Bumble-BFF-style community.

**Benchmarks that would change the plan:**
- If your public compatibility metric climbs above ~90% "yes"/near-ceiling tags with low variance, it's inflating — move it fully private and lean on skill + reliability.
- If no-show rate exceeds ~10–15% (booking-industry norm), escalate from reminders to mandatory deposits.
- If user research still flags "feels like dating," remove remaining swipe mechanics and de-emphasize photo prominence before touching the color palette.

## Caveats
- **Inflation and no-show figures come from adjacent domains** (online labor markets, ride-hail, home-sharing, salon booking), not tennis apps specifically; the direction is robust but exact magnitudes won't transfer.
- Several sports-app details (RacketPal's AI skill algorithm, TennisPAL self-rating complaints, RacketPal's user counts) come from **app-store listings, marketing, press, and user reviews**, not audited data — treat as indicative.
- Uber's ~4.6 deactivation threshold and ~4.89 average are **industry/blog-sourced**, not peer-reviewed; Uber says thresholds vary by city.
- The Airbnb double-blind figures differ slightly between the published *Marketing Science* (2021) version and the earlier NBER working paper; both agree the effect on negativity is real but small.
- Double-blind reveal reduces retaliation but **does not by itself stop inflation** — the labor-market platform studied by Filippas et al. already used simultaneous reveal and still inflated to 85% perfect. Skill-from-results and a private feedback channel are your real defenses.
- FTC rules on incentivized reviews apply if you operate in the US; never condition rewards on positive ratings.
- Background-check norms cited are from **youth** sports (adult-to-minor access); adult peer-play requirements are lighter and largely a product/liability judgment call.