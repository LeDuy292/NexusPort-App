# Driver login review

Branch `fix/driver-account-login` starts from the latest `origin/develop` and
retains its updated driver screens and OLED login design. The previous unpushed
login edit was backed up as `outputs/mobile-login-unpushed.patch` and
`outputs/mobile-login-unpushed-full.tsx` before switching branches.

The useful behavior changes from that edit are retained: no preset credentials or
demo buttons, no server settings in the login UI, and no trimming of passwords.
Develop's new remember-password implementation is removed; it stored plaintext
passwords in AsyncStorage. Old remembered-credential keys are purged during session
loading/sign-out. The existing server-issued JWT session storage remains in use.

API configuration now resolves in this order: explicit `EXPO_PUBLIC_*` environment
value, Expo's current development host, previous saved endpoint. Without an Expo host,
Android emulators use `10.0.2.2`; web/iOS use localhost. API and Node Core retain
ports 3001 and 4000 respectively. `.env.example` uses empty values for automatic
host resolution; explicit deployment/LAN settings belong in ignored `.env.local`.
The machine-specific `.env` previously tracked on develop is removed from Git.

Login continues to call Express `/api/auth/login`, then validates the Driver role
and persists the identity/JWT returned by the server. Restore uses `/api/auth/me`.
Backend account presence alone does not guarantee login: active state and a
matching password are both required. The recovered `tiendriver` account previously
had a random password hash; its legacy test password has now been reset according
to the user's instruction, and real login, `/me` and the Node Driver API passed.

The app also requires `emailVerified=true` for Driver login and session restore;
an active flag alone never grants access to an unverified driver. Only three
explicit legacy accounts are administratively verified; new accounts must use
their email invitation and set their password.

Checks: `npx tsc --noEmit` and `npm test` (62 tests), including physical-phone
host selection, Android emulator fallback, environment override precedence,
credential preservation rules and deletion of old plaintext credential storage.
