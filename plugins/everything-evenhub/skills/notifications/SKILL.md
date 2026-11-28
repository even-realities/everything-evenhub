---
name: notifications
description: Add or debug optional notifications for an Even Hub app with Widgets. Configure notify, implement independent POST polling and receivedIds acknowledgment, and validate permission and delivery using an installed build. Excludes phone OS notifications and portal review messages.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [notification task]
---

# Notifications

Requires an Even Hub app with a Widget declaration, Even Realities App 2.5.0+ and SDK floor 0.0.16+. Dashboard placement and notification permission are independent. Preserve the existing Plugin experience; add Widgets first with [widgets](../widgets/SKILL.md) if needed for the requested feature.

## Declare independent polling

Add this top-level field in `widget/manifest.json`, preserving `data`, layouts, config, bindings and sample data:

```json
"notify": {
  "interval": 60,
  "endpoint": "https://api.example.com/notifications"
}
```

Both fields are required when notify exists. Interval is a positive integer, clamped to at least 60 seconds. Endpoint is an absolute URL with hostname; release packages require HTTPS. Invalid notify rejects the whole Widget declaration. Method and body are fixed and cannot be configured in notify.

Widget data uses its own `data.endpoint` / `data.interval`. Keep matching `data.request.url` / `interval.seconds` for upload compatibility, and use GET for packaged data requests. Do not generate legacy `timer` / `endpoint_notif` keys or a shared GET notification flow. Data and notifications remain separate requests even when endpoint URLs match. Notification data in a Widget response, defaultData or fixture is ignored.

## Backend contract

The App initiates POST to notify.endpoint. The backend queues events; it does not push them to the App.

```http
POST /notifications
Accept: application/json
Content-Type: application/json; charset=utf-8
X-EvenHub-Plugin-Version: 1.0.0
X-EvenHub-Device-SN: <bound-glasses-serial>

{"receivedIds":["delivery-122","delivery-123"]}
```

Body has only `receivedIds`, all pending IDs up to 64, or `[]`. No mapped business parameters, includeWidget or includeNotification flags are sent. No automatic Authorization credential is provided. The SN identifies glasses and does not authenticate a user to your service.

For user-to-glasses association, a binding code saved in settings can travel in the Widget data request alongside the SN when notify is declared. Validate and store that association on the backend. This requires a data request while the Widget is on Dashboard; notification-only polling cannot establish it from a business parameter.

For each notification POST: parse JSON; resolve recipient queue by SN; remove acknowledged IDs idempotently; return at most the queue head without removing it. Unknown IDs are harmless. Bound queue size and event expiry for the product. Return `Cache-Control: no-store` and no redirects.

```json
{
  "notification": {
    "available": true,
    "id": "delivery-124",
    "title": "Delivery update",
    "description": "Your parcel is ready for collection."
  }
}
```

With no event return `{"notification":{"available":false}}`; null or absent notification also works. Only the root notification field is read. `available` must be boolean. When true, id and description must be nonblank strings. ID is stable per event and at most 256 UTF-16 code units. Title may be absent, null or blank; a different non-string type invalidates the event. Invalid events are not acknowledged: repair them so they do not block the queue.

## Timing and delivery

- Poll only installed packages, with login, bound glasses, required settings and both global/per-app permission enabled. QR preview never polls notifications. App must remain running; glasses disconnection does not stop polling but prevents acceptance.
- Intervals start at request completion. Notification requests for one app do not overlap. Widget refresh, foreground, reconnection, settings and Dashboard placement do not reset notification timing.
- Toggle off/on and package updates respect the previous interval (up to two seconds early); App restart may poll immediately.
- 15-second timeout, 2xx UTF-8 JSON response, at most 256 KB, no redirects. Failure retains pending IDs and backs off ×2, ×4 up to 30 minutes or the configured interval if longer. Success restores normal cadence. Data failures and Dashboard placement do not change this behavior.
- Disconnected/updating glasses, or glasses starting/running a Plugin experience: no acceptance or acknowledgment. Keep the backend event queued. Stale responses after permission/account/glasses/package changes are discarded.
- After handoff, explicit glasses rejection or unknown send outcome still counts as accepted. Acknowledgment does not prove display or user attention. IDs persist until a successful notification response; repeat acknowledgment is normal.
- Most recent 256 IDs survive restart, scoped by account, development/release environment, app, glasses SN and notification URL. New endpoint means new scope. Package upgrade or reinstall preserves deduplication records.
- Title/body truncate to 100/1000 characters. Source name is app.json name. Shared delivery queue spaces handoffs by at least three seconds.

## Permission and validation

Each app starts disabled. First opening the installed Plugin page prompts once: Enable permits, Not now/dismiss leaves off. Later use Settings → General → Notifications → Glasses → Glasses notifications, then Sources → Plugins → your app. Per-app choice is phone/account-local. Uninstall clears the choice and reinstall prompts again; deduplication records remain separate. Global off preserves app choices.

1. Validate the manifest with Widget preview, then use [build-and-deploy](../build-and-deploy/SKILL.md) for an installed Private build. The Simulator tests Plugin experience only, and QR preview cannot validate notifications.
2. Confirm the actual package: an installed Beta/store version of the same app takes precedence over Private build.
3. Verify user-to-SN association if required, save configuration, enable both switches, then observe POST with SN and receivedIds.
4. Queue a known event, check glasses display and subsequent body acknowledgment separately. Replay its ID; test restart deduplication.
5. Test missing settings, disabled permission, disconnected glasses, active Plugin experience, malformed content, lost responses and independent endpoint failures. Test notifications with the Widget removed from Dashboard.

Report actual checks and unverified surfaces. Do not upload, invite testers or publish unless the user authorized that action.
