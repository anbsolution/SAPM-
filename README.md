# Attendly — Self Attendance & Payroll

A mobile-first personal attendance and monthly salary estimator PWA. This version uses **browser localStorage only**; it has no login, server database, cloud sync, or secure server-side storage.

## Features
- Check-in/check-out with device timestamps and monthly hours history.
- Configurable monthly salary, working days, daily target, overtime rate, bonus and deductions.
- Paid/unpaid leave entries; unpaid leave is deducted using monthly salary / configured working days.
- Overtime estimate: hours above the configured daily target multiplied by the overtime rate.
- JSON backup/restore; CSV export for attendance and payroll.
- PWA manifest and service worker for static asset caching after first successful load.
- GitHub Actions unit tests and GitHub Pages deployment on the repository's default branch.

## Important limitations
- Records remain in the browser profile/device where entered. Clearing browser data can erase records. Export backups regularly.
- No account, cross-device sync, cloud backup, tamper-proof attendance, server-side timestamp, or server-side authorization.
- Device clock can be changed. Do not treat this as legally verified attendance or an authoritative payroll system.
- Salary is an estimate. Confirm local policy, statutory deductions, holidays, leave and overtime rules before relying on it.
- Static hosting does not make locally stored records private from other people who can access the same unlocked browser/device.

## Run locally
Requires Node.js 22 for tests; the app itself is static.

```sh
npm run check
npm test
python3 -m http.server 8080
```

Open `http://localhost:8080`. Service workers require HTTPS or localhost. GitHub Pages provides HTTPS after Pages is enabled and the deployment workflow succeeds.

## GitHub Pages setup
1. Create a public repository (or use a repository you control) and upload these files, preserving `.github/workflows/`.
2. In repository **Settings → Pages**, set build and deployment source to **GitHub Actions** if prompted.
3. Check **Actions**. The `Test and validate PWA` workflow runs tests before deploying the default branch.
4. Open the Pages URL printed in the successful deployment job and test check-in/out, settings, backup import/export, and offline loading.

Do not add secrets; this static app has no API keys.
