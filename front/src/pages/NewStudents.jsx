
import '../CSS/NewStudents.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function NewStudents() {
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
      name: formData.name,
      password: formData.password
    };

    try {
      const response = await fetch("http://localhost:3000/api/signup-direct", {
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
       if (response.status === 401) {
        localStorage.clear();
        alert('Tu sesión ha expirado');
        navigate('/professorlogin');
        return;
      }

      if (response.ok) {
        console.log("Se creo estudiante exitoso:", data);
        console.log("Status:", response.status);
        alert('¡Estudiante creado exitosamente!');
        
  
        // Guardar token y datos pro
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.reFreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("Datos guardados en localStorage.");

        navigate('/homeprofessor');
      
      } else {
        setError(data.message || "Error en el login");
        console.error("Error del servidor:", data);
        alert('Error al crear el estudiante');
        navigate('/homeprofessor'); ///PROVISIONAL BORRAR DESPUJES
      }
      
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error de conexión con el servidor");
      console.error('❌ Error:', err);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  }
  function handleCancel() {
    
      navigate('/homeprofessor');
    
  }

  return (
    <>
    <head>
      <title>Nuevo Estudiante</title>
    </head>
    <h1 className="NewStudents-title">Nuevo Estudiante</h1>
      <p className="NewStudents-paragraph">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
 <form onSubmit={handleSubmit}>
  <input
          type="text"
          placeholder="Inserte el correo del estudiante"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Inserte el nombre del estudiante"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Inserte el código del estudiante"
          value={formData.codigo}
          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : "Crear Estudiante"}
        </button>

      </form>

      {error && <p style={{color: 'red'}}>{error}</p>}
      {status && <p>Status: {status}</p>}

      <p className="NewStudents-paragraph2">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
      
        <button 
          onClick={handleCancel}
          
          
        >
          ← Volver
        </button>
    </>
  )
}