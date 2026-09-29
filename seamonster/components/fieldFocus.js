// Enter commits a field in Manage by leaving it for the flow window (not the
// page, which would take the editor's keys with it).
export function leaveField(e) {
  const flowWindow = e.target.parentElement.closest('[tabindex]')
  if (flowWindow) flowWindow.focus()
  else e.target.blur()
}
