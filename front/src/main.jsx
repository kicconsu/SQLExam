import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/App.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import ProfessorLogin from './pages/ProfessorLogin.jsx'
import HomePageprofessor from './pages/HomePageProfessor.jsx'
import ViewExam from './pages/ViewExam.jsx'
import ProfessorExam from './pages/ProfessorExam.jsx'
import NewStudents from './pages/NewStudents.jsx'
import HomeStudent from './pages/HomeStudent.jsx'
import { BrowserRouter, Routes, Route} from 'react-router-dom'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<App />} />
        <Route path="studentlogin" element={ <StudentLogin /> } />
        <Route path = "professorlogin" element ={ <ProfessorLogin />} />
        <Route path = "homeprofessor" element ={ <HomePageprofessor />} />
        <Route path = "ProfessorExam" element ={ <ProfessorExam />} />
        <Route path="/viewExam/:examId" element={<ViewExam />} />
        <Route path= "/NewStudents" element ={ <NewStudents />} />
        <Route path= "/homestudent" element ={ <HomeStudent />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,

)
