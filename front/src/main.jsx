import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/App.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import ProfessorLogin from './pages/ProfessorLogin.jsx'
import { BrowserRouter, Routes, Route} from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<App />} />
        <Route path="studentlogin" element={ <StudentLogin /> } />
        <Route path = "professorlogin" element ={ <ProfessorLogin />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>,

)
