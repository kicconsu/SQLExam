import { useState } from 'react'
import '../CSS/ProfessorLogin.css'
import { useNavigate } from 'react-router-dom'
import GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'


export default function ProfessorLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const jsonData = {
      email: formData.email,
      password: formData.password
    };

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData)
      });

      // Capturar el status
      setStatus(response.status);
      
      const data = await response.json();
      console.log("Respuesta del backend:", data);


      if (response.ok) {
        console.log("Login exitoso:", data);
        console.log("Status:", response.status);
  
        // Guardar token y datos pro
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.reFreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("Datos guardados en localStorage.");

        navigate('/homeprofessor');
      
      } else {
        setError(data.message || "Error en el login");
        console.error("Error del servidor:", data);
      }
      
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='login-container'>
      <h1 className="main-title">SQL EXAM</h1>

      <h2 className="ProfessorLogin-title">Professor Login</h2>

      <p className="ProfessorLogin-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
 <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Log in"}
        </button>

      </form>

      {error && <p style={{color: 'red'}}>{error}</p>}
      {status && <p>Status: {status}</p>}

      <p className="ProfessorLogin-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
    </div>
  )
}