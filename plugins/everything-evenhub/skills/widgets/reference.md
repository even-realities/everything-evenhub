# Widget bindings and configuration

Direct binding: `"summary": { "from": "data.summary" }`.

Template binding:

```json
{
  "summary": {
    "template": "{{name}} {{time}}",
    "values": {
      "name": { "from": "data.items[0].name" },
      "time": { "from": "data.items[0].time" }
    }
  }
}
```

Placeholders use letters, digits and underscores. Unresolved placeholders are empty. Paths support nested fields and array indexes, starting with `data.` or `config.`. Strings display unchanged; numbers gain thousands separators; booleans become true/false; arrays and objects render empty. `format.wholeNumbersFrom` can reference a boolean setting for rounding. Compute dates, currencies, conditions and aggregates on the backend.

Save settings through the initialized SDK bridge, checking the boolean result. String setting example:

```json
{
  "scope": {
    "type": "string",
    "source": { "localStorage": "deliveryScope" },
    "required": true,
    "enum": ["inTransit", "all"]
  }
}
```

Config types are string, number, boolean and array. A source declares exactly one of localStorage or value. Keep defaultData.config representative; it does not satisfy missing real required settings. GET query mapping: `"scope": { "from": "config.scope" }`. Arrays can use `join`, defaulting to a comma for query values.

Widget and notification setup live in widget/manifest.json, not app.json notification fields. Preserve app.json identity and version. The Plugin experience uses WebView SDK APIs; Widget layout is declarative and managed by the phone App.
