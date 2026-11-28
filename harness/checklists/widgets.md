# Verification checklist

Read generated files and compare behavior, not only the implementer report.

- [ ] Both views validate, with unique IDs/names, correct counts and in-bounds containers.
- [ ] Images are at most 4 per view and 100×100 each.
- [ ] Manifest contains data.interval/endpoint plus equal compatibility fields, GET query and valid mapping/bindings.
- [ ] Settings key matches source.localStorage; defaultData/fixture use the correct response shape.
- [ ] Files build to dist/widget/; existing Plugin experience is preserved.
- [ ] Phone Widget preview is used; Simulator capability and notification restriction are stated.
