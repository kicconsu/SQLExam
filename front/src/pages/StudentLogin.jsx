import { useEffect, useState } from 'react'
import '../CSS/StudentLogin.css'
import  GetBack from '../components/getback.jsx'

export default function StudentLogin() {

  return (
    <div className='login-container'>
      <h1 className="main-title">
        SQL EXAM
      </h1>
      <h2 className="StudentLogin-title">
        Student Login
      </h2>
      <p className="StudentLogin-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      <form action="http://localhost:3000/api/log-stud" method="post">
        <label for="E-mail">E-mail:</label>
        <input type="text" id="E-mail" name="E-mail" required />
        <br />
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required />
        <br />
        <button type="Login" className="login-button">Login</button>
      </form>
     <p2 className="StudentLogin-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
     </p2>
    </div>
  )
}
