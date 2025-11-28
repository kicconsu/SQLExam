import { useEffect, useState } from 'react'
import '../CSS/HomePageprofessor.css'
import  GetBack from '../components/getback.jsx'
import ButtonRedirect from '../components/buttonredirect.jsx'
import { useNavigate } from 'react-router-dom'

export default function HomePageprofessor() {
  const navigate = useNavigate();
  const [profe, setProfe] = useState(null);
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarExamenes();
  }, []);
  

async function cargarExamenes() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const NAME = {
       
        nombre_examen: projectName
        
      };

      // obtener examenes mando nombre del profe y token
      const response = await fetch('http://localhost:3000/api/exams', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(NAME)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(' Exámenes obtenidos:', data);
        setExamenes(data.Exams); 
      } else {
        setError('Error al cargar los exámenes');
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }
  async function handleDeleteExam(examId, nombreExamen) {
    if (!window.confirm(`¿Seguro que quieres eliminar "${nombreExamen}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const NAME = {
       
        nombre_examen: projectName
        
      };
      const response = await fetch(`http://localhost:3000/api/examenes/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(NAME)
      });

      if (response.ok) {
        alert('Examen eliminado exitosamente');
        cargarExamenes();
      } else {
        alert('Error al eliminar el examen');
      }

    } catch (err) {
      console.error(' Error:', err);
      alert('Error de conexión');
    }
  }

  if (loading) {
    return <div><h1>Cargando exámenes...</h1></div>;
  }


  return (
    <>
      <h1 className="main-title">
        Panel de control
      </h1>

      
      <h3>Tus proyectos</h3>

      <ButtonRedirect 
        to="/professorexam" 
        label="Crear Examen" 
        className="create-exam-button"
      />
      {examenes.length === 0 && !loading && (
        <p>No tienes exámenes creados todavía</p>
      )}

      
      {/* 🎯 BOTONES DE LOS EXÁMENES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {examenes.map((examen) => (
          <div 
            key={examen.id} 
            
          >
            {/* BOTÓN PRINCIPAL DEL EXAMEN */}
            <button
              onClick={() => navigate(`/editar-examen/${examen.id}`)}
              
              
            >
               {examen.nombre_examen}
              <div style={{ fontSize: '14px', fontWeight: 'normal', marginTop: '5px' }}>
                Base de datos: {examen.db_asociada} | Preguntas: {examen.cantidad_preguntas || examen.preguntas?.length || 0}
              </div>
            </button>
            
            {/* Botón de eliminar */}
            <button 
              onClick={() => handleDeleteExam(examen.id, examen.nombre_examen)}
              
            >
               Eliminar
            </button>
          </div>
        ))}
      </div>
  
    </>
  )}