import { useEffect, useState } from 'react'
import '../CSS/ProfessorLogin.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
export default function ProfessorLogin() {

  return (
    <>
    <head>
      <title>Professor Login</title>
    </head>
    <body>
      <h1 class="main-title">
        SQL EXAM
      </h1>
      <h2 class="ProfessorLogin-title">
        Professor Login
      </h2>
      <p class="ProfessorLogin-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      <form action="http://localhost:3000/api/loginf" method="post">
        <label for="E-mail">E-mail:</label>
        <input type="text" id="E-mail" name="E-mail" required />
        <br />
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <br />
        <ButtonRedirect to = "/homeprofessor" label ="loginProfessor" className = 'login-button'/>
      </form>
     <p2 class="ProfessorLogin-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
     </p2>
    </body>
    </>
  )
}

