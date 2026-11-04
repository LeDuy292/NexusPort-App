const {test}=require("node:test");
const assert=require("node:assert/strict");
const {createHarness}=require("./helpers/loadTypeScript.cjs");
const user={id:"driver-login",username:"driver",role:"Driver",isActive:true,token:"session-jwt"};
test("arrival uses the current booking version and the authenticated login",async()=>{
 const updated={id:"booking-id",dispatch:{status:"ready",version:3}};
 const harness=createHarness(async()=>new Response(JSON.stringify({success:true,data:{booking:updated}}),{status:200}));
 harness.values.set("user",JSON.stringify(user));
 const service=harness.load("src/features/bookings/bookingService.ts");
 assert.deepEqual(JSON.parse(JSON.stringify(await service.updateBookingArrival({id:"booking-id",dispatch:{version:2}},"arrive"))),updated);
 const request=harness.requests[0];
 assert.equal(request.url,"http://localhost:3001/api/booking-dispatch/booking-id/arrive");
 assert.equal(request.options.headers.get("Authorization"),"Bearer session-jwt");
 assert.deepEqual(JSON.parse(request.options.body),{expectedVersion:2});
});
test("first arrival sends version zero; conflicting commands are not retried automatically",async()=>{
 const harness=createHarness(async()=>new Response(JSON.stringify({success:false,message:"Điều phối vừa thay đổi."}),{status:409}));
 harness.values.set("user",JSON.stringify(user));
 const service=harness.load("src/features/bookings/bookingService.ts");
 await assert.rejects(service.updateBookingArrival({id:"booking-id",dispatch:null},"arrive"),/vừa thay đổi/);
 assert.equal(harness.requests.length,1);
 assert.deepEqual(JSON.parse(harness.requests[0].options.body),{expectedVersion:0});
 assert.ok(harness.values.get("user"));
});

test("unapproved bookings cannot expose an appointment even when a proposed time exists",()=>{
 const {canViewAppointment}=createHarness(()=>{}).load("src/features/bookings/bookingPresentation.ts");
 const pending={status:"pending",appointmentStart:"2030-10-18T02:00:00Z",approvedAt:null};
 assert.equal(canViewAppointment(pending.status),false);
 for(const status of ["rejected","canceled","cancelled","expired"]) assert.equal(canViewAppointment(status),false);
});

test("approved schedules remain viewable in history without granting another gate entry",()=>{
 const {canViewAppointment,isApproved}=createHarness(()=>{}).load("src/features/bookings/bookingPresentation.ts");
 for(const status of ["approved","ready","APPROVED"]) assert.equal(canViewAppointment(status),true);
 for(const status of ["checked_in","completed"]){
  assert.equal(canViewAppointment(status),true);
  assert.equal(isApproved(status),false);
 }
});
