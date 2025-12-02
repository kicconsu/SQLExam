import { useState } from 'react'
import '../CSS/ProfessorLogin.css'
import { useNavigate } from 'react-router-dom'
import GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'


export default function StudentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    codigo: ""
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
      codigo: formData.codigo
    };

    try {
      const response = await fetch("http://localhost:3000/api/login", { //esta direccion puede varias confirma plis
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
  
        // Guardar token y datos (No se como funcione para estudiantes)
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.reFreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("Datos guardados en localStorage.");

        navigate('/homestudent');
      
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
      <h1 className="main-title">
        SQL EXAM
      </h1>
      <h2 className="StudentLogin-title">
        Student Login
      </h2>
      <p className="StudentLogin-paragraph">
        Bienvenido al portal de estudiantes. Aquí podrás ingresar para presentar los exámenes asignados por tu profesor.
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
          placeholder="Codigo"
          value={formData.codigo}
          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Log in"}
        </button>

      </form>

      {error && <p style={{color: 'red'}}>{error}</p>}
      {status && <p>Status: {status}</p>}

      <p2 className="StudentLogin-paragraph2">
        Asegúrate de tener una conexión estable antes de comenzar tu evaluación.
     </p2>
    </div>
  )
}