# AUDIT OUTSTANDING ITEMS
> Generated 2026-08-16 from 12+ audit/analysis documents
> Total: 177 unique items across 7 categories
> Excludes: already-completed work items (Dashboard KPIs, Parent assiduite calendar, Payment architecture 6-phase, S1-S7 security fixes, F7-F17 bug fixes, R1-R7 reasoning, C1-C5 cloisonnement, T1-T6 targets, D1-D2 durability, L1-L4 governance, ECARTS wiring)

---

## CATEGORY 1: SECURITY (42 items)

| # | ID | Source | Severity | Description |
|---|-----|--------|----------|-------------|
| 1 | S1 | AUDIT_2026-07-31.md | CRITICAL | isAdmin() bypass in CheckRole middleware -- All directeur variants bypass all role checks |
| 2 | S2 | AUDIT_2026-07-31.md | CRITICAL | CorsMiddleware reflects any origin with Allow-Credentials -- ignores config/cors.php whitelist |
| 3 | S3 | AUDIT_2026-07-31.md | CRITICAL | Payment fraud: payment marked completed without provider verification |
| 4 | S4 | AUDIT_2026-07-31.md | CRITICAL | Messaging: client-provided user_id for identity -- enables impersonation and cross-school leaks |
| 5 | S5 | AUDIT_2026-07-31.md | CRITICAL | Cross-tenant data leak in EcoleController -- Ecole::all() returns all schools |
| 6 | S6 | AUDIT_2026-07-31.md | CRITICAL | University module outside multi-tenant model -- 12 models lack BelongsToEcole |
| 7 | S7 | AUDIT_2026-07-31.md | HIGH | File uploads with no type restriction, publicly exposed |
| 8 | S8 | AUDIT_2026-07-31.md | HIGH | Dashboard directeur endpoint has no role middleware |
| 9 | S9 | AUDIT_2026-07-31.md | HIGH | getPaymentHistory without ownership check |
| 10 | S10 | AUDIT_2026-07-31.md | HIGH | getPaymentStats accepts ecole_id from request |
| 11 | S11 | AUDIT_2026-07-31.md | HIGH | FedaPay webhook without signature verification |
| 12 | S12 | AUDIT_2026-07-31.md | HIGH | POST /fedapay/init/{eleve_id} lacks role and ownership checks |
| 13 | S13 | AUDIT_2026-07-31.md | HIGH | X-Ecole-Id header written to session without ownership verification |
| 14 | S14 | AUDIT_2026-07-31.md | MEDIUM | Account enumeration via forgot-password |
| 15 | S15 | AUDIT_2026-07-31.md | HIGH | Multiple routes lack role middleware -- classes/*, parents/{id}/eleves, cahier-texte/*, emploi-du-temps/* |
| 16 | S16 | AUDIT_2026-07-31.md | HIGH | Auth rate limiter indexed on email alone -- unlimited brute-force from single IP |
| 17 | S17 | AUDIT_2026-07-31.md | MEDIUM | IndexedDB cache never purged at logout |
| 18 | S18 | AUDIT_2026-07-31.md | MEDIUM | Password reset: no active session invalidation, token in query string |
| 19 | S19 | AUDIT_2026-07-31.md | MEDIUM | Mobile: token stored in AsyncStorage (unencrypted) -- should use expo-secure-store |
| 20 | S20 | AUDIT_2026-07-31.md | MEDIUM | 12 controllers leak exception messages to clients |
| 21 | S21 | AUDIT_2026-07-31.md | MEDIUM | $request->all() logged in plaintext -- RGPD violation |
| 22 | S22 | AUDIT_2026-07-31.md | LOW | CSP with unsafe-inline and unsafe-eval |
| 23 | S23 | AUDIT_2026-07-31.md | LOW | Electron: no setWindowOpenHandler or will-navigate guard |
| 24 | S24 | AUDIT_2026-07-31.md | CRITICAL | Secrets (APP_KEY + DB_PASSWORD) versioned in Git history |
| 25 | AUTH-1 | AUDIT_COMPLET.md | CRITICAL | Tokens Sanctum without expiration -- stolen tokens valid indefinitely |
| 26 | AUTH-2 | AUDIT_COMPLET.md | CRITICAL | Public registration without auth -- anyone can create accounts with any role |
| 27 | AUTH-3 | AUDIT_COMPLET.md | CRITICAL | Credit card data collected via raw fetch() -- PCI DSS violation |
| 28 | AUTH-4 | AUDIT_COMPLET.md | HIGH | Weak default password in ImportService -- 'ecole123' hardcoded |
| 29 | AUTH-5 | AUDIT_COMPLET.md | MEDIUM | Timing attack on webhook -- no hash_equals() |
| 30 | AUTH-6 | AUDIT_COMPLET.md | MEDIUM | is_active mass-assignable -- self-activation possible |
| 31 | AUTH-7 | AUDIT_COMPLET.md | HIGH | Rate limiting ineffective -- 10,000 req/min |
| 32 | AUTH-8 | AUDIT_COMPLET.md | HIGH | Some routes accessible without auth:sanctum |
| 33 | AUTH-9 | AUDIT_COMPLET.md | HIGH | IDOR on GET /api/eleves/{id} |
| 34 | AUTH-10 | AUDIT_COMPLET.md | HIGH | IDOR on GET /api/notes/eleve/{id} |
| 35 | SEC-1 | RAPPORT_AUDIT_FINAL.md | MEDIUM | 2FA absent |
| 36 | SEC-2 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Missing CSP and HSTS headers |
| 37 | SEC-3 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No session regeneration after login |
| 38 | SEC-4 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Login rate limited but no account lockout |
| 39 | SEC-5 | RAPPORT_AUDIT_FINAL.md | LOW | Missing COEP and COOP headers |
| 40 | SEC-6 | RAPPORT_AUDIT_FINAL.md | HIGH | Hardcoded passwords in AdminUsersSeeder |
| 41 | SEC-7 | RAPPORT_AUDIT_FINAL.md | HIGH | SchoolProvision default password -- 'password1234' |
| 42 | SEC-8 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No email verification |

---

## CATEGORY 2: BUGS (24 items)

| # | ID | Source | Severity | Description |
|---|-----|--------|----------|-------------|
| 1 | F3 | AUDIT_2026-07-31.md | HIGH | Bulletin average calculation wrong -- division hardcoded to 3, Maternelle/Primaire unreachable |
| 2 | F4 | AUDIT_2026-07-31.md | CRITICAL | Two features crash with 500 -- missing class imports in ClassesController and AuthController |
| 3 | F5 | AUDIT_2026-07-31.md | HIGH | Multi-school selection flow broken -- frontend expects data not returned by backend |
| 4 | F6 | AUDIT_2026-07-31.md | MEDIUM | Student update bypasses validation -- email and numero_matricule not validated |
| 5 | F7 | AUDIT_2026-07-31.md | CRITICAL | Payment initialization failed 100% -- no named routes |
| 6 | F8 | AUDIT_2026-07-31.md | CRITICAL | University model namespace case mismatch -- PSR-4 fails on Linux |
| 7 | F9 | AUDIT_2026-07-31.md | CRITICAL | AIService TypeError at boot -- null assigned to string-typed property |
| 8 | F10 | AUDIT_2026-07-31.md | HIGH | tests/Pest.php missing -- 4 Pest test files have no base |
| 9 | F11 | AUDIT_2026-07-31.md | HIGH | Invalid APP_KEY in .env.testing -- 31 bytes instead of 32 |
| 10 | F12 | AUDIT_2026-07-31.md | HIGH | Composer.lock pins incompatible Symfony version -- PHP 8.4 required, CI uses 8.2 |
| 11 | F13 | AUDIT_2026-07-31.md | LOW | Composer advisory ignore list under wrong config key |
| 12 | F14 | AUDIT_2026-07-31.md | MEDIUM | CI workflow uses deprecated options -- --verbose removed in PHPUnit 10+ |
| 13 | F15 | AUDIT_2026-07-31.md | MEDIUM | AIService sends temperature param and reads wrong response format |
| 14 | F16 | AUDIT_2026-07-31.md | HIGH | DevoirController::show selects nonexistent column users.nom |
| 15 | F17 | AUDIT_2026-07-31.md | MEDIUM | routes/tenant.php references nonexistent PaiementController class |
| 16 | C1 | audit-db-consistency.md | CRITICAL | Sessions model conflicts with Laravel sessions table |
| 17 | C2 | audit-db-consistency.md | CRITICAL | Enseignants (plural) class referenced but does not exist |
| 18 | C3 | audit-db-consistency.md | MEDIUM | CompleteDataSeeder imports nonexistent classes |
| 19 | C4 | audit-db-consistency.md | HIGH | Pivot table sessions_candidats referenced but never created |
| 20 | C5 | audit-db-consistency.md | HIGH | FK enseignants_id targets wrong table |
| 21 | H2 | audit-db-consistency.md | MEDIUM | Three concurrent payment systems without integration |
| 22 | H3 | audit-db-consistency.md | MEDIUM | Dual eleves_id and eleve_id in paiements table |
| 23 | C3-old | AUDIT_COMPLET.md | MEDIUM | BulletinDataSeeder completely obsolete |
| 24 | H4 | audit-db-consistency.md | MEDIUM | Contributions::paiements() uses wrong FK name |

---

## CATEGORY 3: PERFORMANCE (16 items)

| # | ID | Source | Severity | Description |
|---|-----|--------|----------|-------------|
| 1 | P1 | AUDIT_2026-07-31.md | CRITICAL | SQL logging active in production -- DB::listen logs every query with PII |
| 2 | P2 | AUDIT_2026-07-31.md | HIGH | Cache invalidation broken -- wrong key used |
| 3 | P3 | AUDIT_2026-07-31.md | HIGH | Endpoints not paginated -- loads ALL data in one response |
| 4 | P4 | AUDIT_2026-07-31.md | HIGH | N+1 queries in multiple controllers |
| 5 | P5 | AUDIT_2026-07-31.md | MEDIUM | Insufficient database indexes -- 8 of 88 migrations |
| 6 | P6 | AUDIT_2026-07-31.md | LOW | Schema::defaultStringLength(191) forces DB connection at boot |
| 7 | P7 | AUDIT_2026-07-31.md | MEDIUM | Large frontend bundles -- xlsx, jspdf, recharts, framer-motion |
| 8 | P8 | AUDIT_2026-07-31.md | LOW | Axios retry on 429 without exponential backoff |
| 9 | PERF-1 | RAPPORT_AUDIT_FINAL.md | HIGH | No Redis/cache driver configured |
| 10 | PERF-2 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No cache on list endpoints |
| 11 | PERF-3 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No virtual scrolling |
| 12 | PERF-4 | RAPPORT_AUDIT_FINAL.md | LOW | Images not optimized |
| 13 | PERF-5 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Bundle size estimated 2MB+ |
| 14 | PERF-6 | AUDIT_COMPLET.md | HIGH | N+1 in BulletinService::calculerRangGeneral |
| 15 | PERF-7 | AUDIT_COMPLET.md | MEDIUM | No OPcache configured |
| 16 | PERF-8 | ANALYSE.md | MEDIUM | Three.js for decorative elements -- 30+ MB for visual effects |

---

## CATEGORY 4: FEATURES (37 items)

| # | ID | Source | Priority | Description |
|---|-----|--------|----------|-------------|
| 1 | F1 | AUDIT_2026-07-31.md | HIGH | Entire SaaS layer is dead code -- TenancyServiceProvider not registered |
| 2 | F2 | AUDIT_2026-07-31.md | CRITICAL | Mobile app cannot authenticate -- createToken() missing from backend |
| 3 | FEAT-1 | RAPPORT_AUDIT_FINAL.md | HIGH | No global search (Command+K) |
| 4 | FEAT-2 | RAPPORT_AUDIT_FINAL.md | HIGH | No push notifications (email + web) |
| 5 | FEAT-3 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No PDF/Excel export everywhere |
| 6 | FEAT-4 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No complete pagination |
| 7 | FEAT-5 | RAPPORT_AUDIT_FINAL.md | HIGH | No complete offline mode |
| 8 | FEAT-6 | RAPPORT_AUDIT_FINAL.md | HIGH | No parent online payment by card |
| 9 | FEAT-7 | RAPPORT_AUDIT_FINAL.md | LOW | No dark mode toggle |
| 10 | FEAT-8 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No customizable dashboard |
| 11 | FEAT-9 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No draft auto-save for grades |
| 12 | FEAT-10 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No approval workflow |
| 13 | FEAT-11 | RAPPORT_AUDIT_FINAL.md | LOW | No electronic signature |
| 14 | FEAT-12 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No visual schedule (calendar-style) |
| 15 | FEAT-13 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No advanced list filters |
| 16 | FEAT-14 | RAPPORT_AUDIT_FINAL.md | LOW | No school directory / trombinoscope |
| 17 | FEAT-15 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No digital parent liaison book |
| 18 | FEAT-16 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No modification history visibility |
| 19 | FEAT-17 | RAPPORT_AUDIT_FINAL.md | HIGH | No e-learning / LMS module |
| 20 | FEAT-18 | RAPPORT_AUDIT_FINAL.md | HIGH | No online admission portal |
| 21 | FEAT-19 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No exam management (planning, rooms, proctoring) |
| 22 | FEAT-20 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No intelligent timetable generation |
| 23 | FEAT-21 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No internship management module |
| 24 | FEAT-22 | RAPPORT_AUDIT_FINAL.md | LOW | No alumni portal |
| 25 | FEAT-23 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No research management |
| 26 | FEAT-24 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No thesis/defense workflow |
| 27 | FEAT-25 | RAPPORT_AUDIT_STRATEGIQUE.md | MEDIUM | No AI student 24/7 chatbot |
| 28 | FEAT-26 | RAPPORT_AUDIT_STRATEGIQUE.md | MEDIUM | No predictive dropout analysis UI |
| 29 | FEAT-27 | RAPPORT_AUDIT_STRATEGIQUE.md | LOW | No AI-assisted correction |
| 30 | FEAT-28 | RAPPORT_AUDIT_STRATEGIQUE.md | MEDIUM | No smart timetable generation algorithm |
| 31 | FEAT-29 | RAPPORT_AUDIT_STRATEGIQUE.md | LOW | No plagiarism detection |
| 32 | FEAT-30 | RAPPORT_AUDIT_STRATEGIQUE.md | LOW | No path/orientation recommendation |
| 33 | FEAT-31 | RAPPORT_AUDIT_STRATEGIQUE.md | HIGH | No SMS/WhatsApp notifications -- critical for African context |
| 34 | FEAT-32 | RAPPORT_AUDIT_STRATEGIQUE.md | HIGH | No multi-currency support -- only FCFA |
| 35 | FEAT-33 | RAPPORT_AUDIT_STRATEGIQUE.md | MEDIUM | No public API documentation |
| 36 | FEAT-34 | ECARTS_FRONT_BACK.md | MEDIUM | Verify remaining data gaps fully wired |
| 37 | FEAT-35 | AUDIT_COMPLET_PRODUIT_ECOLE.md | LOW | No QR code verification on bulletins/diplomas |

---

## CATEGORY 5: TECHNICAL DEBT (29 items)

| # | ID | Source | Priority | Description |
|---|-----|--------|----------|-------------|
| 1 | D1 | RAPPORT_AUDIT_FINAL.md | HIGH | DashboardController monolith -- 12 methods, ~600 lines |
| 2 | D2 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Plural model names -- Notes, Matieres, Classes violate conventions |
| 3 | D3 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Inconsistent controller naming -- snake_case vs PascalCase |
| 4 | D4 | RAPPORT_AUDIT_FINAL.md | HIGH | Duplicate payment models -- 5 models for one entity |
| 5 | D5 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Missing Form Requests |
| 6 | D6 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Missing API Resources |
| 7 | D7 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No Repository pattern |
| 8 | D8 | RAPPORT_AUDIT_FINAL.md | HIGH | No SoftDeletes on any model |
| 9 | D9 | RAPPORT_AUDIT_FINAL.md | HIGH | Missing foreign keys on critical tables |
| 10 | D10 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No API versioning |
| 11 | D11 | RAPPORT_AUDIT_FINAL.md | LOW | Documentation divergent -- Laravel 10 vs 11 |
| 12 | D12 | AUDIT_2026-07-31.md | HIGH | ecole_id remains nullable everywhere -- no backfill |
| 13 | D13 | AUDIT_2026-07-31.md | HIGH | cascadeOnDelete on ecole_id -- no soft-delete |
| 14 | D14 | AUDIT_2026-07-31.md | HIGH | Low test coverage -- 18 test files for 67 controllers |
| 15 | D15 | AUDIT_2026-07-31.md | LOW | Electron app incomplete |
| 16 | D16 | AUDIT_2026-07-31.md | MEDIUM | app/Modules/Central not connected to autoload |
| 17 | D17 | AUDIT_2026-07-31.md | MEDIUM | 5 residual orphan pages behind API_AVAILABLE=false flag |
| 18 | DEBT-1 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Duplicate route configs |
| 19 | DEBT-2 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Two API client systems coexisting |
| 20 | DEBT-3 | RAPPORT_AUDIT_FINAL.md | LOW | Legacy hooks unused |
| 21 | DEBT-4 | RAPPORT_AUDIT_FINAL.md | MEDIUM | 3 seeders overlap on series data |
| 22 | DEBT-5 | RAPPORT_AUDIT_FINAL.md | LOW | CommunicationService exists but never called |
| 23 | DEBT-6 | AUDIT_COMPLET.md | LOW | Dead code: routes/api_ecoles.php never loaded |
| 24 | DEBT-7 | AUDIT_COMPLET.md | MEDIUM | Duplicate CORS middlewares |
| 25 | DEBT-8 | AUDIT_COMPLET.md | MEDIUM | ~30 CSS files with two conflicting systems |
| 26 | DEBT-9 | AUDIT_COMPLET.md | LOW | Two directories for university module |
| 27 | DEBT-10 | AUDIT_COMPLET.md | MEDIUM | Redundant routes per role |
| 28 | DEBT-11 | ANALYSE.md | HIGH | Dashboard data simulated -- 11 of 12 dashboards |
| 29 | DEBT-12 | audit-db-consistency.md | HIGH | 17 tables missing softDeletes() |

---

## CATEGORY 6: UX/UI (14 items)

| # | ID | Source | Priority | Description |
|---|-----|--------|----------|-------------|
| 1 | UX-1 | RAPPORT_AUDIT_FINAL.md | HIGH | No onboarding for new users |
| 2 | UX-2 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No undo on destructive actions |
| 3 | UX-3 | RAPPORT_AUDIT_FINAL.md | MEDIUM | Inconsistent toast feedback |
| 4 | UX-4 | RAPPORT_AUDIT_FINAL.md | HIGH | Dashboard tabs mostly empty -- 70% placeholders |
| 5 | UX-5 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No breadcrumbs |
| 6 | UX-6 | RAPPORT_AUDIT_FINAL.md | HIGH | Accessibility absent -- no ARIA, no WCAG |
| 7 | UX-7 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No global autocomplete on search fields |
| 8 | UX-8 | AUDIT_COMPLET.md | HIGH | 8 dashboards use alert() browser dialogs |
| 9 | UX-9 | AUDIT_COMPLET.md | HIGH | 8 dashboards have no loading states |
| 10 | UX-10 | AUDIT_COMPLET.md | MEDIUM | console.error used silently |
| 11 | UX-11 | AUDIT_COMPLET.md | MEDIUM | Inconsistent visual design -- two CSS systems |
| 12 | UX-12 | audit-report.md | HIGH | Dashboard secondary tabs are empty pages |
| 13 | UX-13 | AUDIT_2026-07-31.md | LOW | Frontend lint warnings -- 1330 in web, 75 in mobile |
| 14 | UX-14 | AUDIT_COMPLET.md | MEDIUM | Some "View" buttons lead nowhere |

---

## CATEGORY 7: INFRASTRUCTURE (15 items)

| # | ID | Source | Priority | Description |
|---|-----|--------|----------|-------------|
| 1 | INF-1 | AUDIT_2026-07-31.md | HIGH | CI not tested in real execution |
| 2 | INF-2 | AUDIT_2026-07-31.md | MEDIUM | CI workflows for mobile/desktop untested |
| 3 | INF-3 | RAPPORT_AUDIT_FINAL.md | HIGH | No CI/CD pipeline |
| 4 | INF-4 | RAPPORT_AUDIT_FINAL.md | HIGH | No staging environment |
| 5 | INF-5 | RAPPORT_AUDIT_FINAL.md | HIGH | No monitoring -- no Sentry, Telescope |
| 6 | INF-6 | RAPPORT_AUDIT_FINAL.md | HIGH | No backup automation |
| 7 | INF-7 | AUDIT_COMPLET.md | HIGH | No CI/CD at all |
| 8 | INF-8 | AUDIT_COMPLET.md | HIGH | No monitoring |
| 9 | INF-9 | AUDIT_COMPLET_PRODUIT_ECOLE.md | CRITICAL | Mobile app non-functional -- 5 blocking bugs |
| 10 | INF-10 | AUDIT_COMPLET_PRODUIT_ECOLE.md | MEDIUM | No load testing |
| 11 | INF-11 | RAPPORT_AUDIT_STRATEGIQUE.md | MEDIUM | No WebSocket server in production |
| 12 | INF-12 | RAPPORT_AUDIT_STRATEGIQUE.md | MEDIUM | No queue supervisor |
| 13 | INF-13 | AUDIT_COMPLET.md | MEDIUM | No API documentation (Swagger/Scramble) |
| 14 | INF-14 | RAPPORT_AUDIT_FINAL.md | MEDIUM | No user documentation |
| 15 | INF-15 | ANALYSE.md | LOW | No Laravel Telescope |

---

## ALREADY COMPLETED (Excluded from above)

| # | Item | Reference |
|---|------|-----------|
| 1 | Dashboard KPIs fixed | Work session |
| 2 | Parent assiduite calendar (CalendrierOfficiel) | Work session |
| 3 | Payment architecture 6-phase correction | Work session |
| 4 | S1-S7 security fixes (palier 1) | AUDIT_2026-07-31.md |
| 5 | F7-F17 bug fixes (pass 3bis) | AUDIT_2026-07-31.md |
| 6 | R1-R7 reasoning consistency (pass 2) | AUDIT_2026-07-31.md |
| 7 | C1-C5 cloisonnement fixes (pass 3) | AUDIT_2026-07-31.md |
| 8 | T1-T6 four-target fixes (pass 4) | AUDIT_2026-07-31.md |
| 9 | D1-D2 durability fixes (pass 4b) | AUDIT_2026-07-31.md |
| 10 | L1-L4 role governance fixes | PLAN_CORRECTIONS_ROLES.md |
| 11 | ECARTS_FRONT_BACK front-end wiring fixes | ECARTS_FRONT_BACK.md |

---

## SUMMARY BY CATEGORY

| Category | Total | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Security | 42 | 9 | 14 | 13 | 6 |
| Bugs | 24 | 6 | 6 | 11 | 1 |
| Features | 37 | 1 | 12 | 18 | 6 |
| Technical Debt | 29 | 0 | 9 | 14 | 6 |
| Infrastructure | 15 | 1 | 7 | 6 | 1 |
| Performance | 16 | 1 | 4 | 8 | 3 |
| UX/UI | 14 | 0 | 6 | 6 | 2 |
| **TOTAL** | **177** | **18** | **58** | **76** | **25** |

---

## SOURCE DOCUMENTS REFERENCED

| Document | Items Contributed |
|----------|-------------------|
| AUDIT_2026-07-31.md | ~45 |
| audit-db-consistency.md | ~12 |
| RAPPORT_AUDIT_FINAL.md | ~55 |
| RAPPORT_AUDIT_STRATEGIQUE.md | ~10 |
| AUDIT_COMPLET.md | ~25 |
| AUDIT_COMPLET_PRODUIT_ECOLE.md | ~3 |
| ECARTS_FRONT_BACK.md | 1 |
| audit-report.md | 1 |
| ANALYSE.md | 2 |

> Note: Many items overlap across multiple documents. Deduplication applied.
> Items from PROGRESS.md, CORRECTIONS_UNIVERSITAIRE.md, MIGRATIONS_UNIVERSITAIRES.md, and STRUCTURE_UNIVERSITAIRE.md excluded as historical/planning documents.
