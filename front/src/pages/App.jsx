
import '../CSS/App.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
export default function App() {

  return (
    <>
    <head>
      <title>SQL EXAM</title>
    </head>
    <body>
      <h1 class="main-title">
        SQL EXAM
      </h1>
      <p class="main-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
     
      <h2>
        Selecciona:
      </h2>

      <ButtonRedirect to="/studentlogin" label="Estudiante" className='student-button'/>
        
      <ButtonRedirect to = "/professorlogin" label ="Professor" className = 'professor-button'/>
        <h1>
        <GetBack />
        </h1>
    </body>
    </>
  )
}


