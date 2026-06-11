# Upload Progress Modal Design

## Goal

Improve the local upload progress modal so it feels like a dedicated progress panel instead of a default modal with a progress bar.

## Chosen Direction

Use a lightweight minimal style that stays consistent with the existing Semi Design UI.

## Visual Design

- Keep `Modal` as the container and avoid adding new heavy dependencies.
- Replace the plain single-line layout with clearer vertical hierarchy.
- Show a compact title and a short supporting subtitle.
- Place the filename in a separate muted info block so long names do not dominate the modal.
- Make the numeric upload percent the primary focal point.
- Keep the `Progress` bar, but make the surrounding layout cleaner and less component-heavy.
- Render the "do not leave page" guidance inside a soft hint block instead of plain body text.

## Content Structure

1. Title
2. Short subtitle describing that the file is being uploaded and conversion will start automatically
3. File info block
4. Large numeric progress value
5. Progress bar
6. Soft guidance block about not leaving the page

## Constraints

- Stay within the existing format-convert page visual language.
- Keep the component file under the repository line-limit rule.
- Any new user-facing copy must be added to i18n resources.
- Do not change the upload behavior, only improve presentation.

## Testing

- Update the modal test to assert the new subtitle and layout text.
- Re-run the targeted format-convert tests.
- Re-run `pnpm --filter @volix/web-pc typecheck`.
