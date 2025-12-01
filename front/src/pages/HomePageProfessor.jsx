import { useEffect, useState } from 'react'
import '../CSS/HomePageprofessor.css'
import GetBack from '../components/getback.jsx'
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
    let token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    // Primera petición
    let response = await fetch('http://localhost:3000/api/exams', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 Response status:', response.status);

    // Si es 401, intenta renovar el token
    if (response.status === 401) {
      console.log('🔄 Token expirado, intentando renovar...');
      
      if (!refreshToken) {
        console.error('❌ No hay refresh token');
        localStorage.clear();
        navigate('/professorlogin');
        return;
      }

      // Llamar al endpoint de ROBLE para renovar el token
      const refreshResponse = await fetch('https://roble-api.openlab.uninorte.edu.co/auth/sqlexam_b05c8db1d5/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        
        // Guardar el nuevo token
        localStorage.setItem('token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        console.log('✅ Token renovado exitosamente');

        // Reintentar la petición original con el nuevo token
        token = data.accessToken;
        response = await fetch('http://localhost:3000/api/exams', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Refresh-Token': refreshToken
          }
        });

      } else {
        console.error('❌ Refresh token inválido');
        localStorage.clear();
        navigate('/professorlogin');
        return;
      }
    }

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Data completa recibida:', data);
      console.log('✅ Primer examen:', data[0]);
      
      // El backend devuelve un array directamente
      if (Array.isArray(data)) {
        setExamenes(data);
      } else {
        setExamenes([]);
      }
      
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

  async function handleDeleteExam(examId, projectName) {
    if (!window.confirm(`¿Seguro que quieres eliminar "${projectName}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch('http://localhost:3000/api/delete-exam', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Refresh-Token': refreshToken ,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectName })
      });

      if (response.ok) {
        alert('Examen eliminado exitosamente');
        cargarExamenes();
      } else {
        alert('Error al eliminar el examen');
      }

    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error de conexión');
    }
  }

  if (loading) {
    return <div><h1>Cargando exámenes...</h1></div>;
  }

  return (
    <>
      <h1 className="main-title">Panel de control</h1>

      <h3>Tus proyectos</h3>

      <ButtonRedirect 
        to="/professorexam" 
        label="Crear Examen"
        className="create-exam-button"
      />

      {examenes.length === 0 && !loading && (
        <p>No tienes exámenes creados todavía</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {examenes.map((examen) => (
         <div key={examen._id}>

            <button
              onClick={() => navigate(`/viewExam/${examen._id}`)} 
            >
              {examen.nombre_examen}
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                Base de datos: {examen.db_asociada} | Preguntas: {examen.preguntas?.length || 0}
              </div>
            </button>

            <button 
              onClick={() => handleDeleteExam(examen._id, examen.nombre_examen)}
            >
              Eliminar
            </button>

          </div>
        ))}
      </div>
    </>
  );
}
