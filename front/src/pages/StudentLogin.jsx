import { useEffect, useState } from 'react'
import '../CSS/StudentLogin.css'
import  GetBack from '../components/getback.jsx'

export default function StudentLogin() {

  return (
    <>
    <head>
      <title>Student Login</title>
    </head>
    <body>
      <h1 class="main-title">
        SQL EXAM
      </h1>
      <h2 class="StudentLogin-title">
        Student Login
      </h2>
      <p class="StudentLogin-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      <form action="http://localhost:3000/api/log-stud" method="post">
        <label for="E-mail">E-mail:</label>
        <input type="text" id="E-mail" name="E-mail" required />
        <br />
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <br />
        <button type="Login" class="login-button">Login</button>
      </form>
     <p2 class="StudentLogin-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
     </p2>
    </body>
    </>
  )
}
