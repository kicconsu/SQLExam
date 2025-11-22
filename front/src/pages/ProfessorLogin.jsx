import { useEffect, useState } from 'react'
import '../CSS/ProfessorLogin.css'
import  GetBack from '../components/getback.jsx'

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
      <form action="http://localhost:3000/api/log-prof" method="post">
        <label for="E-mail">E-mail:</label>
        <input type="text" id="E-mail" name="E-mail" required />
        <br />
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <br />
        <button type="Login" class="login-button">Login</button>
      </form>
     <p2 class="ProfessorLogin-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
     </p2>
    </body>
    </>
  )
}

export function ProfessorPOST() {
    return (
        <div>
            <h2>Professor POST</h2>
        </div>
    )
}   