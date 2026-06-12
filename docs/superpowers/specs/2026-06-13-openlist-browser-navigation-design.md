# OpenList Browser Navigation Design

## Goal

Update the OpenList table browser so navigation is clearer and long names remain usable.

## Scope

- Replace the current path plain text with clickable path segments.
- Render directory names in the name column with link styling and click-to-enter behavior.
- Replace the type column with a size column.
- Truncate long path and file names with ellipsis and expose the full value on hover.

## Non-Goals

- No changes to selection behavior for files or directories.
- No changes to pagination, refresh, or back navigation behavior.
- No API contract changes for the OpenList browse request.

## Existing Context

- `OpenlistTableBrowser` already owns path loading, paging, and row selection.
- The table currently shows `name` and `type`.
- The toolbar currently shows a plain-text current path.
- Recent changes in this area focused on reuse and request ordering safety, so the update should preserve current data flow.

## Proposed Design

### Current Path

- Show the current path as clickable segments from root to the current directory.
- Clicking a segment reloads the browser at that exact path and resets paging to page `1`.
- The rendered path area stays on one line, truncates with ellipsis when space is limited, and exposes the full path through the native hover title.

### Name Column

- Directory rows render the name with Semi link styling and use the existing load flow to enter that directory.
- File rows remain non-clickable text.
- Both directory names and file names truncate to one line with ellipsis and expose the full name through hover title.

### Size Column

- Replace the current type column with a size column.
- Directory rows show an empty value.
- File rows show a formatted size derived from the existing `size` field returned by OpenList.
- Size formatting will use a small local formatter in this component unless an existing shared formatter is found in the relevant app surface.

## Data Flow

- Reuse the existing `load({ path, page })` entry point for:
  - path breadcrumb clicks
  - directory-name clicks
  - pagination
  - refresh
  - back navigation
- Keep request ordering protection unchanged through `requestIdRef`.

## Styling

- Reuse `workbench.module.scss`.
- Add focused classes for:
  - clickable path container
  - path segment link
  - truncated text cell
  - size cell alignment if needed
- Keep the visual language aligned with existing Semi toolbar and table usage.

## Testing

- Add a failing test for clickable current path segments that reload the selected ancestor path.
- Add a failing test for directory names rendering as clickable links that load the directory.
- Add a failing test for the size column so files display formatted size and directories display empty content.
- Keep existing navigation and selection tests passing.

## Risks and Mitigations

- Long path rendering could overflow the toolbar.
  - Mitigation: single-line truncation with `min-width: 0`, ellipsis, and title.
- Size formatting could become inconsistent with other surfaces.
  - Mitigation: reuse an existing formatter if one is available nearby; otherwise keep the formatter minimal and deterministic.

## Success Criteria

- Users can jump to any ancestor path from the current path display.
- Directory names visually read as links and open on click.
- Long paths and names truncate cleanly and reveal the full value on hover.
- The second column shows file sizes and stays empty for directories.
