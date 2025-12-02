import { useState } from 'react'
import '../CSS/ProfessorLogin.css'
import { useNavigate } from 'react-router-dom'
import GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'

export default function StudentLogin() {
  const navigate = useNavigate();
  const [isLoged, setIsLoged] = useState(false);
  const [formData, setFormData] = useState({
    codigo: ""
  });
  const [formData1, setFormData1] = useState({
    Email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  async function handleSubmitCode(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const jsonData = {
      codigo: formData.codigo
    };

    try {
      const response = await fetch(`http://localhost:3000/api/connect-room?codigo=${formData.codigo}`, { //esta direccion puede varias confirma plis
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        
      });

      // Capturar el status
      setStatus(response.status);
      
      const data = await response.json();
      console.log("Respuesta del backend:", data);


      if (response.ok) {
        console.log("Login exitoso:", data);
        console.log("Status:", response.status);

        navigate('/examstudent');
      
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
async function handleSubmitLogin(e) {
   e.preventDefault();
  
  
    setLoading(true);
    setError(null);

    const jsonData = {
      email: formData1.Email,
      password: formData1.password
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
        setIsLoged(true);
  
        // Guardar token y datos (No se como funcione para estudiantes)
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.reFreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("Datos guardados en localStorage.");

        
      
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
    <>
      <h1 className="main-title">Student Login</h1>

      <h2 className="StudentLogin-title">Bienvenido</h2>

      <p className="StudentLogin-paragraph">
        Ingrese el usuario y contraseña proporcionados por su profesor       </p>
 <form onSubmit={handleSubmitLogin}>
       <input
          type="text"
          placeholder="E-mail"
          value={formData1.Email}
          onChange={(e) => setFormData1({ ...formData1, Email: e.target.value })}
          disabled={loading}
          required />

        <input
          type="password"
          placeholder="Contraseña"
          value={formData1.password}
          onChange={(e) => setFormData1({ ...formData1, password: e.target.value })}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Log in"}
        </button>

      </form>
       {isLoged && <span >✓ Usted esta logeado </span>}
    <p className="StudentLogin-paragraph">
         Ingrese el codigo del examen proporcionado por su profesor       </p>
 <form onSubmit={handleSubmitCode}>
     
        <input
          type="password"
          placeholder="Código del examen"
          value={formData.codigo}
          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          disabled={loading}
        />

        <button type="submit" disabled={!isLoged}>
          {loading ? "Cargando..." : "Ingresar al examen"}
        </button>

      </form>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {status && <p>Status: {status}</p>}
      

      <p className="StudentLogin-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
    </>
  )
}