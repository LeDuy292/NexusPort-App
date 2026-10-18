# Driver journey · NXP-114

The Driver home screen restores the overview dashboard in a light theme, with
booking counts, shortcuts, the next approved appointment and recent bookings.
The bottom navigation separates Overview, Journey, Bookings, Notifications and
Account. `yard-navigation` opens the dedicated journey component.
Booking details remain read-only; readiness, arrival and container confirmation
actions belong to their current journey stage. Old QR/container demo URLs redirect
to the canonical journey or assigned bookings rather than simulating success.
Pending bookings show a clear approval notice instead of proposed appointment
times, a timeline or arrival actions. Schedules become visible after approval;
previously approved bookings remain readable during and after the journey.

## Stages and evidence

| Stage | Current until | Driver action |
| --- | --- | --- |
| Ready | Dispatcher permission becomes active | Arrival/readiness and call acknowledgment |
| Gate In | Canonical Gate In is persisted | Present assigned truck for gate recognition |
| To yard | Arrival at the assigned destination is persisted | Confirm arrival at that destination |
| Handover | Booking is ready for exit, including all required containers | Confirm container only after Yard completion |
| To exit | Confirmed position reaches exit gate, or Gate Out completes | Follow the assigned exit route |
| Gate Out | Canonical Gate Out is persisted | Wait for the gate system |
| Completed | Terminal | Review milestones and booking details |

Completed stages are green, the active stage is yellow, and future stages are
gray. Selecting another stage changes the information being viewed, never the
business state or the available action. Timestamps come from server evidence.
For multi-container bookings, changing the selected container keeps the booking
scope and never implies all other containers are complete.
The app shows the number of confirmed containers and provides a shortcut to the
next unfinished container. Exit instructions retain the same booking number;
the driver does not create a second booking to leave the yard.

The gate opens after successful server verification. The temporary Gate Control
simulator supplies passage after its open interval (default ten seconds). The
app advances only after the passage API has persisted Gate In/Out, not after an
independent timer in the Driver app.

## Map and realtime

`GET /api/v1/drivers/me/yard-map` returns the current approved map using the same
linked-Driver authentication as route endpoints. It grants no gate permission
and includes no other driver's booking assignment. Pre-entry screens can display
the approved 2D layout; in-port routes use the map and geometry returned by the
canonical route API. No fallback yard geometry is invented.

The truck marker shows a confirmed milestone: outside the entrance during
readiness, entrance during Gate In, last confirmed route node while driving,
assigned stop during handover, and exit after Gate Out. This is not continuous
GPS tracking. The map has an overview, a zoomed horizontal view, and a larger
modal. Restrictions, occupancy and route directions come from the server.

The app listens for Yard completion and targeted `driver.journey.updated`
invalidations, then fetches canonical state again. Socket rooms use the linked
`drivers.id`, not the JWT user account ID. Gate In and Gate Out publish after
commit; broker failure does not undo passage. A 15-second refresh and foreground
refresh provide recovery. Stale data is labeled and mutation controls are
disabled on request failures. An older polling response cannot overwrite a
newer arrival/confirmation response.
Map failures are reported separately from canonical journey failures. A map
outage does not disable booking arrival/readiness actions when the booking feed
is current. Arrival and handover still require canonical server permissions.
The complete route list is reused for the selected container and progress counts,
avoiding a duplicate detail/map request on every refresh. Booking snapshots also
refresh after targeted Gate/Yard events so the two views converge promptly.

This release preserves the existing graph and routing algorithm. More complex
maps, traffic prediction and AI route selection can extend that graph later.

## Verification and rollout

- `npx tsc --noEmit`
- `node --test tests/auth.test.cjs tests/bookings.test.cjs tests/smart-route.test.cjs tests/journey.test.cjs`
- `node scripts/expo.cjs export --platform web --output-dir ../outputs/driver-journey-web`
- Node Core: driver route controller, yard journey and realtime tests.
- C#: build the Gate module after the post-commit event change.

Restart Node Core and C# and reload/rebuild the app. This change adds no database
migration. Keep the existing approved map and dispatcher/gate prerequisites.
Local UI fixtures in the workspace outputs folder do not connect to a database
and must not be used as a deployed API.
