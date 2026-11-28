# Verification checklist

Read generated files and compare behavior, not only the implementer report.

- [ ] notify has independent interval and endpoint; no timer/endpoint_notif or shared GET contract.
- [ ] POST JSON body contains only receivedIds, up to 64, initially empty.
- [ ] No automatic Authorization or business-parameter forwarding invented.
- [ ] Binding code association requires the Widget data request; notification polling identifies SN.
- [ ] Queue removes acknowledged IDs idempotently and returns one stable-ID event.
- [ ] Restart deduplication, delivery eligibility, independent backoff, first-use prompt and uninstall behavior are covered.
- [ ] Test plan uses an installed build, not QR preview or Simulator, and does not claim tests ran.
