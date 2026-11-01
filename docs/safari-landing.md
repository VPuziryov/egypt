# Sadko safari landing — RU / EN

## Scope and status

New `/safari/` entry with `/safari/ru/` and `/safari/en/`. This is a proposed replacement for WordPress's full enquiry landing pages. Existing root Egypt landing and `/schedule/` remain unchanged. Standalone schedule still has no contact/form buttons. No production redirects have been switched by this work.

Branch based on `feature/egypt-schedule`; this PR depends on the schedule PR. It reuses its responsive schedule CSS and source map. The design preserves Sadko's offer from the owner's reference: Red Sea, from €750/person, Hurghada pickup, transfer, twin cabins/four meals, 3–4 dives/night dives/guide and EAN28/32 for certified divers. Confirm current commercial conditions before publication. Wreck hero image comes from the existing owner site, `/wp-content/uploads/2023/02/Egypt-Liveaboard-7.jpg`.

## One form

A sailing's Enquire button pre-fills boat, route, departure and return dates. Dates can be changed to approximate period, help choosing, or a general question. Trip format is individual/buddy, small group, partial charter or full charter. Party size may be unknown. Approximate dates require a period; question mode requires a question. Name and one contact (email or Telegram/WhatsApp) required. Optional group/company and comment. This is an enquiry, not a cabin reservation.

Selected sailing is resolved again server-side against the published English schedule. Boat/route/dates must still match; client-supplied price is ignored. The source is shared with `/schedule/`, and source files/formulas/publication were not edited.

## Request delivery — setup required before live use

Dedicated Netlify Function: `/.netlify/functions/safari-request`. Uses Node built-ins and Google Sheets REST; no additional npm dependencies or paid form service. It follows Ecomile's save-first, notify-second architecture but does not change Ecomile's handler, configuration, or other projects.

In **Egypt project's Netlify environment**, configure:

- `GOOGLE_SERVICE_ACCOUNT`: service-account JSON (may reuse the existing Ecomile account, without copying it into GitHub).
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`: the intended notification bot and recipient, as used by Ecomile or separately chosen by the owner.
- Optional `SAFARI_SPREADSHEET_ID`; defaults to the exact created request spreadsheet below.

Share the new spreadsheet with that service account as editor. Do not publish this private request spreadsheet to the web. No new public Drive permissions were added by this PR.

Target: https://docs.google.com/spreadsheets/d/1jRTKf1lh1Brhb20d9FYeGOj8iKM57XOALv6-7cgT2TM/edit
Folder: @ДАЙВИНГ → САДКО. Tab: Leads.

A:P mapping: request timestamp UTC, name, combined contact, company/group, source URL, message (includes trip format/date mode/period/party size), boat, route, start, end, party size, source price, language, NEW status, blank internal notes, request ID. Append uses RAW to prevent formula interpretation. No fake leads seeded. Request ID is reused on retries; prior IDs are checked in column P. This is ordinary retry deduplication, not atomic locking against concurrent identical submissions. No payment/booking lock exists.

GET returns only a configured boolean. Without required env variables, UI disables submission and explains that online enquiries are not connected yet; POST returns 503 and never claims success. A save failure preserves form entries. Telegram failure after a successful append does not lose the saved enquiry. Do not put secrets into source, browser code, screenshots or chat.

## Tracking

Pixel `675997335920840`: PageView, `ViewContent_EgyptSafari_7s` after cumulative visible time, `Open_EgyptSafariRequest` once per page on form focus/sailing selection, and `Lead_EgyptSafariRequest` only after a successful server response. Browser/server delivery to Meta not independently verified. Lead means saved enquiry, not confirmed booking.

## Validation

- Eight Node tests passed including original schedule tests, general/approximate/question modes, all party formats, unknown party size, validation, source revalidation, authoritative source price, RAW append, save failure, Telegram failure and missing configuration.
- RU live source loads 83 non-completed sailings in browser. Desktop selection of first sailing correctly fills Sunshine / North+Tiran / 7–14 Nov 2026 / €750. Switching to approximate dates and full charter works.
- Desktop and 390px RU/EN mobile visuals inspected. No form submit was sent to a live recipient or spreadsheet because Egypt secrets/access are not yet confirmed. Hosted function readiness must be checked in Deploy Preview.
- Real end-to-end append + Telegram notification remains a required setup/launch check. Do not present mocked tests as real delivery verification.

## Publishing order

Review preview → configure function/Sheet access → submit one clearly labelled test enquiry and verify exact row and notification → explicit owner approval → publish pages → separately update WordPress redirect destinations and correct the root Egypt landing's EN request button. Existing shortlinks retain their purpose: `/dive/eg-schedule-form-ru/` and `/dive/eg-timetable/` to RU full landing, `/dive/eg-schedule-form-en/` to EN full landing. PDF fixes remain a separate Hub task.
