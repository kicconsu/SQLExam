import { useEffect, useState } from 'react'
import '../CSS/HomePageprofessor.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
import { useNavigate } from 'react-router-dom'

export default function HomePageprofessor() {
  const navigate = useNavigate();
  const [profe, setProfe] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const profeData = localStorage.getItem("user");

    if (!token || !profeData) {
      navigate('/professorlogin');
      return;
    }

    try {
      const parsedProfe = JSON.parse(profeData);
      setProfe(parsedProfe);
    } catch (error) {
      console.error("Error al parsear datos:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate('/professorlogin');
    }
  }, [navigate]);

  return (
    <>
      <h1 className="main-title">
        Panel de control
      </h1>

      {profe && (
        <h2>
          Bienvenido, {profe.nombre || profe.name || profe.email || "Profesor"}
        </h2>
      )}

      <h3>Tus proyectos</h3>

      <ButtonRedirect 
        to="/professorexam" 
        label="Crear Examen" 
        className="create-exam-button"
      />
    </>
  )}