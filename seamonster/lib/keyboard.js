// Whether a key event is going into a text field, where the editor's single-key
// shortcuts (panel hotkeys, Delete) must not fire.
export const isTyping = (e) =>
  !!e.target.closest?.('input, textarea, select, [contenteditable="true"]')
