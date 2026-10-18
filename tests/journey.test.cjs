const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/loadTypeScript.cjs');
const model = () => createHarness(() => {}).load('src/features/driver/journeyPresentation.ts');
const booking = (status = 'approved', entry = 'active') => ({ status, gateEntryOrder: { status: entry }, dispatch: { readyAt: '2026-10-18T01:00:00Z' } });
const route = (phase, extra = {}) => ({ gateTransactionId: 'gate-in', journey: { phase, gateInAt: '2026-10-18T02:00:00Z', ...extra } });

test('timeline uses dispatch permission and canonical Gate In rather than a local timer', () => {
  const { currentJourneyStage } = model();
  assert.equal(currentJourneyStage(booking('approved', 'pending_ack')), 'ready');
  assert.equal(currentJourneyStage(booking()), 'gate_in');
  assert.equal(currentJourneyStage(booking(), route('to_yard')), 'to_yard');
  assert.equal(currentJourneyStage(booking('approved', 'expired')), 'ready');
});

test('inside drivers never receive readiness actions while route details are temporarily missing', () => {
  const { currentJourneyStage } = model();
  assert.equal(currentJourneyStage(booking('checked_in', 'consumed')), 'to_yard');
  assert.equal(currentJourneyStage(booking('completed', 'consumed')), 'to_yard');
});

test('arrival, handover, exit road and completion use server evidence', () => {
  const { currentJourneyStage } = model();
  assert.equal(currentJourneyStage(booking(), route('at_yard')), 'handover');
  assert.equal(currentJourneyStage(booking(), route('at_yard', { containerConfirmedAt: 'now' })), 'handover', 'one confirmed container does not imply the whole booking is ready to exit');
  assert.equal(currentJourneyStage(booking(), route('ready_for_gate_out', { exitGateCode: 'GATE-03' })), 'to_exit');
  assert.equal(currentJourneyStage(booking(), { ...route('ready_for_gate_out', { exitGateCode: 'GATE-03' }), navigation: { origin: { gateCode: 'GATE-03' } } }), 'gate_out');
  assert.equal(currentJourneyStage(booking(), route('exited', { gateOutAt: '2026-10-18T03:00:00Z' })), 'completed');
});

test('past stages stay complete, the active stage is distinct, and future stages stay pending', () => {
  const { journeyStageState, stageTimestamp } = model();
  assert.equal(journeyStageState('gate_in', 'handover'), 'done');
  assert.equal(journeyStageState('handover', 'handover'), 'active');
  assert.equal(journeyStageState('gate_out', 'handover'), 'pending');
  assert.equal(journeyStageState('completed', 'completed'), 'done');
  assert.equal(stageTimestamp('gate_out', booking(), route('handover')), null);
});

test('the pre-entry map endpoint uses the signed-in Driver session', async () => {
  const h = createHarness(async () => new Response(JSON.stringify({ success: true, data: { map: { version: 'approved-map' } } }), { status: 200 }));
  h.values.set('user', JSON.stringify({ id: 'driver-account', username: 'driver', token: 'driver-token', role: 'Driver', isActive: true }));
  const result = await h.load('src/features/driver/services/smartRouteService.ts').getDriverYardMap();
  assert.equal(result.map.version, 'approved-map');
  assert.equal(h.requests[0].url, 'http://localhost:4000/api/v1/drivers/me/yard-map');
  assert.equal(h.requests[0].options.headers.get('Authorization'), 'Bearer driver-token');
});

test('multi-container progress never counts another booking and selects the next unfinished container', () => {
  const { containerProgress } = model();
  const trip = { id: 'this-booking', containers: [{ id: 'one' }, { id: 'two' }] };
  const routes = [{ bookingId: 'other', containerId: 'two', journey: { containerConfirmedAt: 'now' } },
    { bookingId: trip.id, containerId: 'one', journey: { containerConfirmedAt: 'now' } }];
  assert.equal(containerProgress(trip, routes).confirmed, 1);
  assert.equal(containerProgress(trip, routes).next.id, 'two');
  routes.push({ bookingId: trip.id, containerId: 'two', journey: { containerConfirmedAt: 'now' } });
  assert.equal(containerProgress(trip, routes).confirmed, 2);
  assert.equal(containerProgress(trip, routes).next, null);
});

test('pending and closed booking notices do not change cancellation policy or invent gate passage', () => {
  const { bookingJourneyNotice, currentJourneyStage } = model();
  assert.match(bookingJourneyNotice(booking('pending')), /chờ duyệt/);
  assert.match(bookingJourneyNotice(booking('canceled')), /không còn/);
  assert.equal(bookingJourneyNotice(booking('checked_in')), null);
  assert.notEqual(currentJourneyStage(booking('completed', 'consumed')), 'completed');
});

const snapshotHarness = handler => {
  const h = createHarness(handler);
  h.values.set('user', JSON.stringify({ id: 'account', username: 'driver', token: 'token', role: 'Driver', isActive: true }));
  return h;
};
const response = (data, status = 200) => new Response(JSON.stringify({ success: status === 200, data, message: 'Dịch vụ tạm gián đoạn' }), { status });

test('a missing map is a separate warning and does not turn successful route/readiness data into a failure', async () => {
  const h = snapshotHarness(url => Promise.resolve(url.endsWith('/yard-map') ? response(null, 503) : response([])));
  const result = await h.load('src/features/driver/journeySnapshot.ts').loadJourneySnapshot('booking', 'container');
  assert.equal(result.error, null);
  assert.equal(result.route, null);
  assert.match(result.mapWarning, /tạm gián đoạn/);
  assert.equal(h.requests.length, 2);
});

test('the complete route list supplies the exact booking and approved map without a duplicate detail request', async () => {
  const routes = [{ bookingId: 'old', containerId: 'same' },
    { bookingId: 'current', containerId: 'same', navigation: { map: { version: 'approved-route-map' } } }];
  const h = snapshotHarness(url => Promise.resolve(url.endsWith('/yard-map') ? response(null, 503) : response(routes)));
  const result = await h.load('src/features/driver/journeySnapshot.ts').loadJourneySnapshot('current', 'same');
  assert.equal(result.route.bookingId, 'current');
  assert.equal(result.map.version, 'approved-route-map');
  assert.equal(result.mapWarning, null);
  assert.equal(result.error, null);
  assert.equal(h.requests.length, 2);
});

test('an available map never hides a failed canonical journey request', async () => {
  const h = snapshotHarness(url => Promise.resolve(url.endsWith('/yard-map') ? response({ map: { version: 'approved' } }) : response(null, 503)));
  const result = await h.load('src/features/driver/journeySnapshot.ts').loadJourneySnapshot('booking', 'container');
  assert.match(result.error, /tạm gián đoạn/);
  assert.equal(result.route, null);
  assert.equal(result.map.version, 'approved');
});
