# Verification Checklist: sdk-reference

Read actual files/output. Do NOT trust the implementer's report.

## 1. CreateStartUpPageContainer Interface (5 items)

- [ ] `containerTotalNum` field is shown with its valid range (1–12)
- [ ] `widgetId` field is shown
- [ ] `listObject` field is shown (array of `ListContainerProperty`)
- [ ] `textObject` field is shown (array of `TextContainerProperty`) with max-8 limit noted
- [ ] `imageObject` field is shown (array of `ImageContainerProperty`) with max-4 limit noted

## 2. TextContainerProperty Interface (5 items)

- [ ] `containerName` field shown (max 16 chars)
- [ ] `x`, `y` position fields shown with valid range (0–576 / 0–288)
- [ ] `width` and `height` fields shown
- [ ] `isEventCapture` field shown with explanation of its role
- [ ] At least one additional field (e.g. `text`, `fontSize`, `borderWidth`) shown with its range

## 3. ListContainerProperty Interface (3 items)

- [ ] `listObject` / item list field shown with max 20 items limit
- [ ] Per-item character limit of 64 chars is mentioned
- [ ] `isEventCapture` field is shown for this interface too

## 4. ImageContainerProperty Interface (3 items)

- [ ] Width range shown as 20–200 pixels
- [ ] Height range shown as 20–100 pixels
- [ ] At least one other field (e.g. `imgBase64` or `imageType`) shown

## 5. StartUpPageCreateResult Enum (4 items)

- [ ] `Success` = 0 is listed
- [ ] `Invalid` = 1 is listed
- [ ] `Oversize` = 2 is listed
- [ ] `OutOfMemory` = 3 is listed

## 6. isEventCapture Rule (2 items)

- [ ] The rule is stated: exactly one container per page must have `isEventCapture: 1`
- [ ] The consequence of violating this rule is explained (events won't fire or behavior is undefined)

## Scoring

- **Total items:** 22
- **Pass threshold:** 22/22 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
