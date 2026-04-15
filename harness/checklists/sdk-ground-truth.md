# Verification Checklist: sdk-ground-truth

Install the SDK if not present (`npm install @evenrealities/even_hub_sdk`), then read `.d.ts` files from `node_modules/@evenrealities/even_hub_sdk`. Compare against `skills/sdk-reference/SKILL.md` and any other skill that references SDK types.

## 1. Interface Existence (5 items)

- [ ] `TextContainerProperty` exists in SDK exports
- [ ] `ListContainerProperty` exists in SDK exports
- [ ] `ListItemContainerProperty` exists in SDK exports
- [ ] `ImageContainerProperty` exists in SDK exports
- [ ] `TextContainerUpgrade` (or equivalent) exists in SDK exports

## 2. TextContainerProperty Fields (5 items)

- [ ] All fields listed in sdk-reference exist in the SDK interface (no phantom fields)
- [ ] No SDK fields are missing from sdk-reference (no undocumented fields)
- [ ] Field types match (number, string, etc.)
- [ ] `isEventCapture` type is correct (0 | 1, number, or boolean)
- [ ] `content` field type and presence match

## 3. Enum Completeness (4 items)

- [ ] `OsEventTypeList` — all values in sdk-reference exist in SDK, with correct numeric assignments
- [ ] `DeviceConnectType` — all values match
- [ ] `StartUpPageCreateResult` — all values match
- [ ] `ImageRawDataUpdateResult` — all values match

## 4. Method Signatures (4 items)

- [ ] `createStartUpPageContainer` parameter type matches SDK
- [ ] `rebuildPageContainer` parameter type matches SDK
- [ ] `textContainerUpgrade` parameter type matches SDK
- [ ] `updateImageRawData` parameter type matches SDK

## 5. Missing SDK Exports (2 items)

- [ ] List any public SDK exports (interfaces, types, enums, functions) not mentioned in any skill
- [ ] For each missing export, note whether it is user-facing or internal

## Scoring

- **Total items:** 20
- **Pass threshold:** 18/20 (allow up to 2 undocumented internal types)
- For each FAIL: quote the SDK definition and the skill claim side by side
- **Skill improvement suggestions:** provide the exact edit needed to align the skill with the SDK
