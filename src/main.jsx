import React from 'react'
import ReactDOM from 'react-dom/client'

// Brand fonts (self-hosted) — Inter (UI/body) + Sora (display/headings)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/sora/500.css'
import '@fontsource/sora/600.css'
import '@fontsource/sora/700.css'

import App from '@/App.jsx'
import '@/index.css'

// NOTE: StrictMode stays off for now to avoid double-invoking effects in the
// still-legacy pages during the redesign. Re-enable once pages are migrated.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
