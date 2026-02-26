# Notes Feature Design
**Date:** 2026-02-26

## Summary

Add a "Notes" tab alongside Agenda, Calendar, and List. Any task flagged as a note routes to the Notes view instead of the Agenda view. The "Note" flag is set via a new checkbox in the EditPanel, next to the existing "No Date" checkbox. The List view gains a type badge ("Agenda" or "Note") per row.

---

## Backend

### `models.py`
Add one column to the `Task` model:
```python
is_note = Column(Boolean, default=False, nullable=False)
```

### `database.py`
Add a startup migration:
```sql
ALTER TABLE tasks ADD COLUMN is_note BOOLEAN NOT NULL DEFAULT 0
```
Run every startup — SQLite no-ops if the column already exists.

### `schemas.py`
- Add `is_note: bool = False` to `TaskBase` (inherited by `TaskCreate` and `Task`)
- Add `is_note: Optional[bool] = None` to `TaskUpdate`

### `crud.py`
Update `get_tasks()`:
- `agenda` view: add `.filter(Task.is_note == False)` to existing date/sort logic
- `notes` view: same date/sort logic as agenda, but `.filter(Task.is_note == True)`
- `list` and `calendar` views: unchanged

---

## Frontend

### `AppContext.jsx`
- `openEditPanel` gains a third optional param: `defaultIsNote = false`
- `editPanelState` stores `defaultIsNote`

### `NavTabs.jsx`
- Add `{ id: 'notes', label: 'Notes' }` tab
- Show "+ add row" button for `notes` view (calls `openEditPanel(null, null, true)`)

### `App.jsx`
- Render `<AgendaView view="notes" />` when `currentView === 'notes'`

### `AgendaView.jsx`
- Accept `view` prop (default `'agenda'`)
- Pass `view` to `useTasks(view)`

### `EditPanel.jsx`
- Add `is_note` boolean state (default `false`)
- On open: initialize from `task.is_note` (edit mode) or `defaultIsNote` from context (new mode)
- Render a "Note" checkbox to the right of the "No Date" checkbox
- Include `is_note` in create payload and auto-save debounce

### `ListView.jsx`
- After the date column, render a small pill badge: `Note` (muted accent color) or `Agenda` (gray), always visible

---

## Behaviour Rules

- `is_note = false` (default) → appears in Agenda view
- `is_note = true` → appears in Notes view
- Toggling the checkbox while editing immediately re-routes the item on next load
- Notes view uses identical drag-and-drop and sort_order logic as Agenda
- Calendar view unaffected (shows all dated tasks regardless of is_note)
- List view shows all tasks with a type badge
