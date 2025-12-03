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
      const response = await fetch(`http://localhost:3000/api/connect-room?llave=${formData.codigo}`, { //esta direccion puede varias confirma plis
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
          "Content-Type": "application/json"
        },
        
      });

      // Capturar el status
      setStatus(response.status);
      
      const data = await response.json();
      console.log("Respuesta del backend:", data);


      if (response.ok) {
        console.log("Entrada existosa:", data);
        console.log("Status:", response.status);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("roomCode", formData.codigo);
        localStorage.setItem("infoexamen", JSON.stringify(data.infoExamen));
        localStorage.setItem("nombreDb", data.nombreDb);
        navigate('/examstudent');
      
      } else {
        setError(data.message || "Error al entrar en el examen");
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
 <form className="student-form" onSubmit={handleSubmitLogin}>
        <input
          type="text"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
          required />

        <input
          type="password"
          placeholder="Contraseña"
          value={formData1.password}
          onChange={(e) => setFormData1({ ...formData1, password: e.target.value })}
          disabled={loading}
        />

        <button type="submit" className='btn' disabled={loading}>
          {loading ? "Cargando..." : "Log in"}
        </button>

      </form>
       {isLoged && <div style={{ color: 'green', marginTop: 8 }}>✓ Usted está logeado</div>}
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
      <p2 className="StudentLogin-paragraph2">
        Asegúrate de tener una conexión estable antes de comenzar tu evaluación.
     </p2>
    </div>
  )
}