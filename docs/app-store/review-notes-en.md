# App Review Information — notes to paste in App Store Connect

Paste the text below verbatim into the "Notes" field of App Review
Information. Credentials go only in the secure Sign-In fields next to it —
never in this file or in Git.

```text
Lestinaty is a native habit-building app. The reviewer account credentials are provided in the secure fields above.
On iOS, authentication uses email and password only; Google Sign-In and Android widgets are not included in this binary.
Core flow: Today > open a habit > complete its node > Senderos shows progression.
Gem packs: Store > Gems. Purchases are fulfilled only after RevenueCat's verified webhook — allow a few seconds after a sandbox purchase for the balance to update.
Horizon: Profile > Membership. Restore Purchases and Manage Subscription are available there.
Push reminders are optional and requested only after the reviewer enables a habit reminder — the app never asks for notification permission at launch.
Account deletion: Profile > Privacy and your data > Delete account. Confirm twice; deletion is immediate and permanent. A separate disposable account is available in the review credentials notes for this destructive test.
Chests are earned through habit progress, are not sold, and never consume purchased currency.
```

## Before pasting this

1. Create a demo account seeded with 2-3 habits, some completed days,
   Senderos progress, and a nonzero gem balance — confirmed by password, no
   OTP step required for the reviewer.
2. Create a second, disposable demo account (fresh, minimal data) dedicated
   to testing the "Delete account" flow, so the primary demo account stays
   available for re-review.
3. Put both sets of credentials only in the App Review Information's
   secure username/password fields — never in this repo.
4. Verify login works from a clean install before submitting.
