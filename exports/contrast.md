# Contrast report (0.1.0-draft.1, profile: default)

Measured on resolved sRGB values with the WCAG 2.x formula. A pass here is a design target for the named role, not an application-wide conformance claim. Waived pairs are listed with their reason.

| Pair | State | Kind | Foreground | Background | Ratio | Minimum | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| default text on canvas | — | text | `color.text.default` #e99499 | `color.surface.canvas` #0c0909 | 8.65 | 4.5 | pass |
| default text on default surface | — | text | `color.text.default` #e99499 | `color.surface.default` #160b0b | 8.43 | 4.5 | pass |
| default text on raised | — | text | `color.text.default` #e99499 | `color.surface.raised` #241010 | 7.92 | 4.5 | pass |
| bright text on canvas | — | text | `color.text.bright` #ffa2a7 | `color.surface.canvas` #0c0909 | 10.37 | 4.5 | pass |
| prose on canvas | — | text | `color.text.prose` #f4eeee | `color.surface.canvas` #0c0909 | 17.30 | 4.5 | pass |
| prose on sunken | — | text | `color.text.prose` #f4eeee | `color.surface.sunken` #0a0707 | 17.50 | 4.5 | pass |
| muted text on canvas | — | text | `color.text.muted` #bd787d | `color.surface.canvas` #0c0909 | 5.81 | 4.5 | pass |
| muted text on raised | — | text | `color.text.muted` #bd787d | `color.surface.raised` #241010 | 5.31 | 4.5 | pass |
| subtle text on canvas | — | text | `color.text.subtle` #ad7175 | `color.surface.canvas` #0c0909 | 5.10 | 4.5 | pass |
| subtle text on raised | — | text | `color.text.subtle` #ad7175 | `color.surface.raised` #241010 | 4.66 | 4.5 | pass |
| disabled text on canvas (exempt; house floor 3:1) | — | ui | `color.text.disabled` #8a5559 | `color.surface.canvas` #0c0909 | 3.33 | 3 | pass |
| placeholder on input | — | text | `color.text.placeholder` #bd787d | `color.surface.input` #0c0909 | 5.81 | 4.5 | pass |
| accent text on canvas | — | text | `color.text.accent` #e53935 | `color.surface.canvas` #0c0909 | 4.69 | 4.5 | pass |
| accent text on default surface | — | text | `color.text.accent` #e53935 | `color.surface.default` #160b0b | 4.57 | 4.5 | pass |
| strong accent on raised | — | text | `color.text.accent-strong` #f73f35 | `color.surface.raised` #241010 | 4.94 | 4.5 | pass |
| link on canvas | — | text | `color.text.link` #ffa2a7 | `color.surface.canvas` #0c0909 | 10.37 | 4.5 | pass |
| link hover text on strong hover fill | — | text | `color.text.link-hover` #f4eeee | `color.interaction.hover.bg-strong` #630f0d | 11.41 | 4.5 | pass |
| selection text on selection | — | text | `color.interaction.selection.text` #f4eeee | `color.interaction.selection.bg` #911410 | 7.92 | 4.5 | pass |
| inactive selection text on inactive selection | — | text | `color.interaction.selection.inactive-text` #e99499 | `color.interaction.selection.inactive-bg` #420f0c | 7.02 | 4.5 | pass |
| primary action text on fill | — | text | `color.action.primary.text` #f4eeee | `color.action.primary.bg` #871f19 | 8.17 | 4.5 | pass |
| primary action text on hover fill | — | text | `color.action.primary.text` #f4eeee | `color.action.primary.hover-bg` #911410 | 7.92 | 4.5 | pass |
| secondary action text on canvas | — | text | `color.action.secondary.text` #ffa2a7 | `color.surface.canvas` #0c0909 | 10.37 | 4.5 | pass |
| destructive text on canvas | — | text | `color.action.destructive.text` #f73f35 | `color.surface.canvas` #0c0909 | 5.40 | 4.5 | pass |
| destructive hover text on hover fill | — | text | `color.action.destructive.hover-text` #f9faf9 | `color.action.destructive.hover-bg` #dc282e | 4.58 | 4.5 | pass |
| danger text on canvas | — | text | `color.status.danger.text` #f73f35 | `color.surface.canvas` #0c0909 | 5.40 | 4.5 | pass |
| danger text on danger tint | — | text | `color.status.danger.text` #f73f35 | `color.status.danger.tint` #2b0e0d | 4.88 | 4.5 | pass |
| danger on-fill text | — | text | `color.status.danger.on-fill` #f9faf9 | `color.status.danger.fill` #dc282e | 4.58 | 4.5 | pass |
| warning text on canvas | — | text | `color.status.warning.text` #c9973f | `color.surface.canvas` #0c0909 | 7.54 | 4.5 | pass |
| warning text on warning tint | — | text | `color.status.warning.text` #c9973f | `color.status.warning.tint` #1f1a0c | 6.59 | 4.5 | pass |
| warning on-fill text | — | text | `color.status.warning.on-fill` #0c0909 | `color.status.warning.fill` #c9973f | 7.54 | 4.5 | pass |
| success text on canvas | — | text | `color.status.success.text` #86a46f | `color.surface.canvas` #0c0909 | 7.13 | 4.5 | pass |
| success text on success tint | — | text | `color.status.success.text` #86a46f | `color.status.success.tint` #0f1a0e | 6.43 | 4.5 | pass |
| success on-fill text | — | text | `color.status.success.on-fill` #0c0909 | `color.status.success.fill` #86a46f | 7.13 | 4.5 | pass |
| info text on canvas | — | text | `color.status.info.text` #7e9ebb | `color.surface.canvas` #0c0909 | 7.08 | 4.5 | pass |
| info text on info tint | — | text | `color.status.info.text` #7e9ebb | `color.status.info.tint` #0f141c | 6.59 | 4.5 | pass |
| info on-fill text | — | text | `color.status.info.on-fill` #0c0909 | `color.status.info.fill` #7e9ebb | 7.08 | 4.5 | pass |
| neutral on-fill text | — | text | `color.status.neutral.on-fill` #000000 | `color.status.neutral.fill` #a3676b | 4.71 | 4.5 | pass |
| focus ring on canvas | — | ui | `color.interaction.focus.ring` #e53935 | `color.surface.canvas` #0c0909 | 4.69 | 3 | pass |
| focus ring on default surface | — | ui | `color.interaction.focus.ring` #e53935 | `color.surface.default` #160b0b | 4.57 | 3 | pass |
| container focus ring on selection | — | ui | `color.interaction.focus.ring-container` #ffa2a7 | `color.interaction.selection.bg` #911410 | 4.75 | 3 | pass |
| control border on input | — | ui | `color.border.control` #a3676b | `color.surface.input` #0c0909 | 4.45 | 3 | pass |
| control border on default surface | — | ui | `color.border.control` #a3676b | `color.surface.default` #160b0b | 4.33 | 3 | pass |
| active border on input | — | ui | `color.border.active` #e53935 | `color.surface.input` #0c0909 | 4.69 | 3 | pass |
| decorative border on canvas (decorative; not a control edge) | — | ui | `color.border.default` #531310 | `color.surface.canvas` #0c0909 | 1.39 | 3 | waived: decorative hairline; never the only boundary of a control (spec/foundations.md) |
| strong rule on canvas (decorative) | — | ui | `color.border.strong` #9e231f | `color.surface.canvas` #0c0909 | 2.56 | 3 | waived: 2px decorative rule paired with a surface change; never the only boundary of a control |
| line numbers on code background | — | text | `color.code.line-number` #ad7175 | `color.code.bg` #0c0909 | 5.10 | 4.5 | pass |
| caret on current line | — | ui | `color.code.caret` #e99499 | `color.code.current-line` #1c0a09 | 8.35 | 3 | pass |
| comment on code background | — | text | `color.code.syntax.comment` #ad7175 | `color.code.bg` #0c0909 | 5.10 | 4.5 | pass |
| string on code background | — | text | `color.code.syntax.string` #bd787d | `color.code.bg` #0c0909 | 5.81 | 4.5 | pass |
| keyword on code background | — | text | `color.code.syntax.keyword` #f73f35 | `color.code.bg` #0c0909 | 5.40 | 4.5 | pass |
| type on code background | — | text | `color.code.syntax.type` #b37175 | `color.code.bg` #0c0909 | 5.23 | 4.5 | pass |
| muted text on editor selection | — | text | `color.text.muted` #bd787d | `color.code.selection-bg` #420f0c | 4.71 | 4.5 | pass |
| current search match text | — | text | `color.code.search-current-text` #0c0909 | `color.code.search-current-bg` #ffa2a7 | 10.37 | 4.5 | pass |
| error text on canvas | — | text | `color.diagnostic.error.text` #f73f35 | `color.surface.canvas` #0c0909 | 5.40 | 4.5 | pass |
| warning diagnostic text on canvas | — | text | `color.diagnostic.warning.text` #c9973f | `color.surface.canvas` #0c0909 | 7.54 | 4.5 | pass |
| info diagnostic text on canvas | — | text | `color.diagnostic.info.text` #7e9ebb | `color.surface.canvas` #0c0909 | 7.08 | 4.5 | pass |
| default text on added-line background | — | text | `color.text.default` #e99499 | `color.diff.added.bg` #0f1a0e | 7.80 | 4.5 | pass |
| default text on removed-line background | — | text | `color.text.default` #e99499 | `color.diff.removed.bg` #2b0e0d | 7.82 | 4.5 | pass |
| default text on modified-line background | — | text | `color.text.default` #e99499 | `color.diff.modified.bg` #1f1a0c | 7.56 | 4.5 | pass |
| terminal foreground | — | text | `color.terminal.fg` #e99499 | `color.terminal.bg` #0c0909 | 8.65 | 4.5 | pass |
| chart label on canvas | — | text | `color.chart.label` #bd787d | `color.surface.canvas` #0c0909 | 5.81 | 4.5 | pass |
| chart series 4 on canvas (graphic) | — | ui | `color.chart.series-4` #a3676b | `color.surface.canvas` #0c0909 | 4.45 | 3 | pass |
| decorative icon on canvas (graphic) | — | ui | `color.icon.decorative` #a3676b | `color.surface.canvas` #0c0909 | 4.45 | 3 | pass |
