# Feature Landscape

**Domain:** AI Blind Battle Arena (Korean-focused, university student audience)
**Researched:** 2026-04-07
**Benchmark:** arena.ai (LMSYS Chatbot Arena), Galaxy.ai, Artificial Analysis

## Table Stakes

Features users expect from an AI battle/comparison product. Missing any of these and the product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Blind battle (2 anonymous models) | Core mechanic of every arena product. arena.ai proved this model works. Without it, there is no product. | Medium | Must randomly select 2 of 3 models (GPT/Claude/Gemini), ensure same model is not picked twice |
| Side-by-side response display | Users need to compare responses simultaneously. Arena.ai, Galaxy.ai all use dual-panel layout. | Low | Two columns on desktop, stacked on mobile |
| Voting mechanism (A wins / B wins / Tie / Both bad) | arena.ai uses exactly these 4 options. "Tie" and "Both bad" are important for honest evaluation. Fewer options frustrate users who feel neither answer was good. | Low | 4 buttons: A wins, B wins, Tie (draw), Both bad |
| Model reveal after vote | The "aha moment" that makes battles satisfying. Every arena product reveals identities post-vote. This is the core payoff loop. | Low | Show model names + logos after vote submission |
| Korean language UI | Target audience is Korean university students. English UI is a non-starter for this demographic. | Low | Full Korean localization: buttons, labels, instructions, error messages |
| Korean language prompting | Models must be prompted in Korean and respond in Korean. System prompts should instruct Korean-language responses. | Low | System prompt engineering to ensure Korean output |
| Streaming responses | Users expect real-time token streaming, not waiting for complete responses. Every modern chat product streams. Without it, the experience feels slow and broken. | Medium | Both model responses should stream simultaneously side-by-side. Use SSE or WebSocket. |
| Mobile-responsive layout | 71%+ of Korean university students access services via mobile. A desktop-only arena will miss the majority of users. | Medium | Stacked layout on mobile, swipe between A/B responses, fixed vote buttons |
| Rate limiting / abuse prevention | No auth in v1 means abuse is the primary threat. Without rate limiting, API costs spiral and service dies. | Medium | IP-based rate limiting, daily battle count cap (e.g. 20-30 per IP), progressive cooldowns |
| Basic loading/error states | Users need feedback when models are generating, when API calls fail, or when rate limits are hit. | Low | Loading spinners per response panel, error messages in Korean, retry button |

## Differentiators

Features that set K-Index apart from arena.ai and generic comparison tools. Not expected but create competitive advantage, especially for the Korean student audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Korean-specific evaluation criteria hints | Prompt users to consider Korean-specific quality: naturalness (자연스러움), honorific appropriateness (존댓말/반말), cultural context understanding. No other arena does this. | Low | Small helper text near vote buttons: "어떤 답변이 더 자연스러운 한국어인가요?" |
| Preset prompt categories for students | arena.ai has NO preset prompts by design. But Korean students have specific use cases: homework help (과제), cover letters (자소서), personal counseling (고민상담). Preset categories lower the barrier to entry. | Low | Category chips/buttons above prompt input. Selecting a category pre-fills a sample prompt or shows examples. |
| Sample prompts per category | New users don't know what to ask. Provide curated Korean-language sample prompts per category to reduce friction. | Low | "Try this prompt" suggestions, rotated randomly |
| Season system with countdown | Unique to K-Index. Creates urgency, enables graceful shutdown, generates marketing buzz. "Season 1 ends in 3 days" drives engagement spikes. | Low | Season banner, countdown timer, "season ended" lock screen |
| Battle result summary card (shareable) | After voting, show a shareable card: "I chose [Model A] over [Model B] for [category]". Korean students share everything on KakaoTalk/Instagram. Viral growth lever. | Medium | Generate an OG image or styled card. Share button with KakaoTalk, copy link, Instagram story format. |
| Response quality metrics display | Show response time (latency) and character/word count for each response. Helps users make more informed votes and adds a "data nerd" appeal. | Low | Small metadata below each response: "응답 시간: 2.3초 | 글자 수: 342자" |
| Dark mode | Research shows university students prefer dark mode for extended reading sessions. Reduces eye strain for nighttime use (peak student hours). | Low | CSS theme toggle, persist preference in localStorage |
| Battle history (local) | Without auth, store recent battles in localStorage so users can revisit their comparison history. No other arena does local-first history well. | Medium | localStorage-based, show last 10-20 battles, clear button |
| Cumulative vote tally (simple stats) | Even without a full ELO leaderboard (deferred to v2), showing "GPT has won 54% of battles this season" adds value and makes the product feel alive. | Medium | Server-side vote counting, displayed on a simple "current standings" section |

## Anti-Features

Features to explicitly NOT build in v1. Each is tempting but would add complexity, cost, or scope without proportional value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User authentication (login/signup) | Adds friction, reduces viral adoption, requires password/session management. Korean students want instant gratification. v1 value prop is "open the site, battle immediately." | IP-based rate limiting + season system for abuse control. Add auth in v2 when you need persistent profiles. |
| Full ELO/Bradley-Terry ranking system | Requires significant statistical infrastructure, meaningful vote volume, and anti-gaming measures. arena.ai has 6M+ votes to make their rankings reliable. K-Index will not have that in v1. | Simple win-rate percentages per model per season. "GPT won 54% of battles" is honest and useful. Defer proper ELO to v2 with enough data. |
| Multi-turn conversations | arena.ai supports follow-up questions. But multi-turn dramatically increases API costs (context grows per turn), complexity (conversation state management), and abuse surface. | Single-turn battles only. Each battle is one prompt, two responses, one vote. Clean and simple. |
| Direct model selection (non-blind) | arena.ai offers "Direct Chat" and "Side-by-Side" modes where users pick models. This undermines the blind comparison value prop, which is K-Index's core mechanic. | Blind-only in v1. The entire point is unbiased comparison. Direct chat is a different product. |
| Category-specific leaderboards | Tempting to build separate rankings for homework/cover letters/counseling. But fragmenting votes across categories reduces statistical significance and adds UI complexity. | Single overall standings in v1. Categories are just prompt suggestions, not separate evaluation tracks. |
| Prompt moderation / content filtering | Building custom content moderation is complex and error-prone. The AI models themselves already have built-in safety filters. | Rely on model-level safety filters. Add a simple profanity word list at most. Report button for egregious content. |
| Model parameter customization (temperature, max tokens) | Power-user feature that confuses students and introduces variables that make comparisons unfair. | Fixed parameters for all battles. Same temperature, same max token limit, same system prompt structure. Ensures fair comparison. |
| Admin dashboard with analytics | Tempting to build before having users. Wait until there is actual data worth analyzing. | Log votes to database. Build analytics only when you have enough data to analyze (v2). |
| Internationalization (i18n) beyond Korean | English or other language support adds complexity with no benefit for the target audience. | Korean-only. If international demand appears later, address it then. |
| Real-time multiplayer battles | "Battle your friend" sounds fun but adds WebSocket complexity, matchmaking, and synchronization for minimal value. | Solo battles. Share results after the fact via shareable cards. |
| Image/code/multimodal arenas | arena.ai expanded to vision, code, video arenas. These are separate products requiring different UI, different evaluation criteria, and different model capabilities. | Text-only battles. Scope creep into multimodal is the fastest way to never ship. |

## Feature Dependencies

```
Rate limiting ──────────────────────> Blind battle (must protect before exposing)
Blind battle ───────────────────────> Side-by-side display
Side-by-side display ───────────────> Streaming responses
Side-by-side display ───────────────> Voting mechanism
Voting mechanism ───────────────────> Model reveal
Model reveal ───────────────────────> Battle result summary card (shareable)
Voting mechanism ───────────────────> Cumulative vote tally

Season system (independent) ────────> Battle availability toggle
Preset categories (independent) ────> Sample prompts per category
Dark mode (independent) ────────────> (no dependencies)
Local battle history (independent) ─> (requires only localStorage)

Korean UI ──────────────────────────> Everything (base requirement)
```

**Critical path:** Rate limiting --> Blind battle --> Side-by-side + Streaming --> Voting --> Model reveal

**Independent features (can be added anytime):** Dark mode, Season system, Preset categories, Local history

## MVP Recommendation

### Must Ship (without these it is not a product)

1. **Blind battle core loop** - Prompt input, random model selection, side-by-side streaming responses, 4-option voting, model reveal
2. **Korean language UI** - Full Korean interface, Korean system prompts for models
3. **Rate limiting** - IP-based daily cap, without this API costs are unbounded
4. **Mobile-responsive layout** - Students are on phones
5. **Loading/error states** - Basic UX polish so it doesn't feel broken

### Ship Soon After (high value, low effort)

6. **Preset prompt categories** - Homework/Cover letter/Counseling chips above input, with sample prompts
7. **Season system** - Banner, countdown, lock mechanism for graceful shutdown
8. **Dark mode** - localStorage toggle, CSS variables
9. **Response metadata** - Show response time and character count per response

### Defer (v2 or later)

- **Shareable battle cards** - Needs design work and OG image generation
- **Cumulative vote tally** - Needs enough data to be meaningful
- **Battle history (local)** - Nice to have, not critical for launch
- **Full ELO ranking** - Needs statistical volume
- **User authentication** - Needed for persistent profiles, personalization
- **Category-specific leaderboards** - Needs auth + enough categorized votes
- **Korean AI models (HyperCLOVA X, EXAONE)** - Needs vendor partnerships

## Competitive Landscape Reference

| Feature | arena.ai | Galaxy.ai | K-Index (planned) |
|---------|----------|-----------|-------------------|
| Blind battle | Yes | No (direct compare) | Yes (core) |
| Model count | 140+ | ~10 | 3 (v1) |
| Voting options | A/B/Tie/Both bad | None (just compare) | A/B/Tie/Both bad |
| ELO ranking | Yes (Bradley-Terry) | No | No (v1), Yes (v2) |
| Preset categories | No (free-form only) | No | Yes (student-focused) |
| Korean specialization | Category exists but not focus | None | Core differentiator |
| Auth required | No | Yes (account) | No |
| Multi-turn | Yes | Yes | No (v1) |
| Season system | No | No | Yes (unique) |
| Shareable results | Limited | No | Planned |
| Dark mode | Yes | Yes | Planned |
| Mobile-first | Responsive | Responsive | Mobile-first |

## Sources

- [arena.ai How It Works](https://arena.ai/how-it-works)
- [arena.ai Blog: March 2026 Updates](https://arena.ai/blog/march-2026-arena-updates/)
- [arena.ai Blog: Categories](https://arena.ai/blog/arena-category/)
- [LMSYS Chatbot Arena Review 2025](https://skywork.ai/blog/chatbot-arena-lmsys-review-2025/)
- [LMSYS Complete Guide 2025](https://www.promptt.dev/blog/lmsys-arena-the-complete-guide-to-the-chatbot-arena-leaderboard-2025)
- [Galaxy.ai Arena](https://chat.galaxy.ai/arena)
- [AI말평 Korean Language Benchmark](https://kli.korean.go.kr/benchmark/home.do)
- [Korean LLM Benchmark (Elice)](https://elice.io/en/newsroom/llm-benchmark-korea-elice)
- [Korean LLM Comparison (Artificial Analysis)](https://artificialanalysis.ai/models/multilingual/korean)
- [Korean Students AI Usage (Linkareer)](https://community.linkareer.com/employment_data/4817562)
- [University Students Dark Mode Research](https://arxiv.org/pdf/2409.10895)
- [AI UX Writing: Formal vs Informal Speech (DBpia)](https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE11609586)
- [Chatbot Arena Paper (arXiv)](https://arxiv.org/html/2403.04132v1)
