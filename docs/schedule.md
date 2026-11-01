# Egypt schedule — implementation and handoff

Status: PR only; not published to production. Existing landing, WordPress forms, PDF links and redirects are unchanged.

## Pages

- `/schedule/`: language entry; optional `?lang=ru` / `?lang=en` wins, then saved `langPref`, then browser language. Hub RU group: ru, uk, be, kk; all others EN.
- `/schedule/ru/` and `/schedule/en/`: explicit language pages; direct paths are never overridden. Manual switch saves `langPref`, matching the existing Egypt landing storage key. Query parameters and fragments survive navigation.
- No contact buttons, forms, checkout, booking selection or Telegram redirects.

## One existing data source

Google Drive folder: https://drive.google.com/drive/folders/1X5dc0GEnG22fDurXcNd1Zzhzv-Jm2k4y

Spreadsheet: https://docs.google.com/spreadsheets/d/1qp3bpTk8XZ1l3Qigb7wHLISyX2niFGmOM8hvxGhrgj4/edit

Published ID: `2PACX-1vQajGKJrlO2o2G9Q6Qo0RhvdKnhrrzG7gLnXozQVhm-v8geWoKIysK-FessVWvwnj20n6z0tUQ6nMJm`

RU gid: `1556887608`; EN gid: `1984293992`.

Each page fetches the matching existing published CSV at runtime, without a secret/API key or repository data snapshot. No Drive files, formulas or publication permissions were changed. Existing update workflow remains Sadko XLSX → SOURCE_Liveaboard → OUTPUT main → Витрина расписания.

CSV mapping: A departure, C return, E route, F price, G available places, H boat, I departure port, K return port, L confirmed/planned. Intro rows are not imported as HTML or contact links. Text is rendered with textContent. Prices and availability remain source values; no price recalculation. Completed voyages (return date before visitor's local today) are hidden; ongoing voyages remain visible. Month filtering uses departure month. Google publication may take time to reflect source changes; the displayed loading time is not claimed to be source freshness.

Responsive table above 760px; cards at/below 760px. Month/status filters, refresh, empty/error states, source-table link and noscript fallback. Twenty-second fetch timeout, no fabricated/stale fallback dataset. Schedule routes/assets override the existing year-long cache with no-store.

## Pixel

Existing Pixel ID `675997335920840`: PageView once per document, proposed new custom event `ViewContent_EgyptSchedule_7s` once after seven cumulative seconds visible. Hidden time excluded. No contact/request/purchase events. Pixel follows the existing Egypt site's loading approach; actual Meta ingestion/custom audience configuration was not verified. Real navigation between locales loads another document and may generate another PageView.

## Verified locally on 2026-11-01

- Live published RU and EN CSV fetched successfully in browser; each displayed 83 non-completed sailings. First: 07–14 Nov 2026, Sunshine, North+Tiran, €750, 9 places. These are observed source values, not independently guaranteed inventory.
- RU/EN switch and translated status/date controls; month and status filters, including zero results.
- Visual inspection: desktop and two 390px iframe viewports for mobile RU/EN; source data loaded in both.
- `node --check` for all three JS files.
- `node --test tests/schedule.test.cjs`: routing including Hub language group, CSV quoted fields/date validation, and visible-time Pixel event pause/resume/single fire.
- Production route and Meta event reception remain unverified until approved deployment.

## After owner approval

Publish this PR, then verify `/schedule/`, RU/EN paths, source loading, cache rules and Meta Test Events on the production host. ManyChat schedule buttons already reference `https://egypt.iscuba.online/schedule/` per owner; until deployment that destination is not ready. WordPress request landing links remain unchanged. Main Egypt landing's EN request button currently points to RU; that is a separate known correction, not silently included here.

Current bot handoff from this conversation: `https://iscuba.online/dive/tg-eg/` was changed by owner to `https://telegram.me/puziryov_bot?start=w62523580`; automation `iScuba | Egypt Safari | RU–EN`, tag `iScuba_Egypt`. Original @IscubaOnline_bot was found in separate Free workspace «Виртуальный Дайв…». No ManyChat edits made by this PR.
