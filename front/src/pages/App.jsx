
import '../CSS/App.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
export default function App() {

  return (
    <div className='landing-wrapper'>
    <div className='landing-card'>
      <h1 className="main-title">
        SQL EXAM
      </h1>

      <p className="main-tagline">
        Plataforma para gestionar y presentar exámenes de SQL de forma sencilla.
      </p>
      <p className="main-paragraph">
          Elige tu rol para continuar.
        </p>

      <div className='role-saction'>
      <h2 className='role-title'>Selecciona:
      </h2>

      <div className='role-buttons'>
      <ButtonRedirect to="/studentlogin" label="Estudiante" className='role-button'/>
        
      <ButtonRedirect to = "/professorlogin" label ="Professor" className = 'role-button'/>
      </div>
      </div>
    </div>
    <div className='landing-footer'>
      <GetBack />
    </div>
    </div>
  )
}


