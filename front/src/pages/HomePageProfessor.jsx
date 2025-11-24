import { useEffect, useState } from 'react'
import '../CSS/HomePageprofessor.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
export default function HomePageprofessor() {

  return (
    <>
    <head>
      <title> Home </title>
    </head>
    <body>
      <h1 class="main-title">
        Panel de control
      </h1>
      <h2>
        Tus proyectos
      </h2>
      <ButtonRedirect to = "/professorexam" label ="Crear Examen" className = 'create-exam-button'/>

      
        
    </body>
    </>
  )
}


