import { defineTheme } from 'seamonster'

// An app's own theme: FLOWDARK with a deep-water brand gradient (the title,
// and hovered panel titles, rails and menu items). defineTheme takes any of
// styles.css's tokens; base supplies the rest.
defineTheme({
  name: 'ABYSS',
  base: 'FLOWDARK',
  tokens: { '--flow-brand-from': '#2ec5b6', '--flow-brand-to': '#1f5f9e' },
})
