import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import store from './store/store.js'
import { Provider } from 'react-redux'
import { loadUserFromStorage } from './store/authSlice.js'
import { initializeCarpoolSystem } from './services/carpoolInitializer.js'
import './services/carpoolDebug.js' // Load debug utilities

// Load user session from localStorage on app start
store.dispatch(loadUserFromStorage());

// Initialize carpool system with sample data (first time only)
initializeCarpoolSystem();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)

