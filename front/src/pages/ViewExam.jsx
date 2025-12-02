import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import "../CSS/ViewExam.css";

export default function ViewExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const location = useLocation();
  
  
  const [projectName, setProjectName] = useState('');
  const [originalProjectName, setOriginalProjectName] = useState('');
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dbAsociada, setDbAsociada] = useState(null);
  const [dbFileName, setDbFileName] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDb, setEditingDb] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [actual, setActual] = useState(0);
  const [nombreExamen, setNombreExamen] = useState('');

  // Cargar datos del examen al montar el componente
  useEffect(() => {
    cargarExamen();
  }, [examId]);

  async function cargarExamen() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!token) {
        navigate('/professorlogin');
        return;
      }

      // Obtener datos del examen
      const responseExam = await fetch(
        `http://localhost:3000/api/exams?_id=${examId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Refresh-Token': refreshToken
          }
        }
      );

      if (responseExam.status === 401) {
        localStorage.clear();
        alert('Tu sesión ha expirado');
        navigate('/professorlogin');
        return;
      }

      if (responseExam.ok) {
        const examData = await responseExam.json();
        console.log('📋 Datos del examen:', examData);

        // Si viene desde el home: location.state.examen
        const examen = location.state?.examen || examData[0];

        if (examen) {
          setProjectName(examen.nombre_examen);
          setOriginalProjectName(examen.nombre_examen);
          setDbFileName(examen.db_asociada);
          setIsPublished(examen.publicado || false);

          // Obtener preguntas
          const responsePreguntas = await fetch(
            `http://localhost:3000/api/exams?_id=${examId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-Refresh-Token': refreshToken
              }
            }
          );

          if (responsePreguntas.ok) {
            const preguntas = await responsePreguntas.json();
            console.log('❓ Preguntas:', preguntas);
            setList(preguntas || []);
          }

        } else {
          setError('Examen no encontrado');
        }
      } else {
        setError('Error al cargar el examen');
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  function addQuestion(e) {
    e.preventDefault();

    if (question.trim() === '' || answer.trim() === '') {
      alert("Por favor escribe la pregunta y respuesta");
      return;
    }

    const newItem = { 
      numero_pregunta: list.length + 1,
      enunciado: question,
      consulta_esperada: answer,
      nombre_examen: projectName
    };

    setList([...list, newItem]);
    setQuestion("");
    setAnswer("");
  }

  function deleteItem(index) {
    if (window.confirm('¿Eliminar esta pregunta?')) {
      setList(list.filter((_, i) => i !== index));
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    
    if (file) {
      if (!file.name.endsWith('.sql')) {
        alert('Por favor selecciona un archivo .sql');
        e.target.value = '';
        return;
      }
      
      setDbAsociada(file);
      setDbFileName(file.name);
      console.log('📁 Archivo seleccionado:', file.name);
    }
  }

  async function handleSaveChanges() {
    if (!projectName.trim()) {
      alert('Por favor ingresa el nombre del examen');
      return;
    }

    if (list.length === 0) {
      alert('El examen debe tener al menos una pregunta');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!token) {
        navigate('/professorlogin');
        return;
      }

      const formData = new FormData();
      
      if (dbAsociada) {
        formData.append('db_asociada', dbAsociada);
      }

      const preguntasFormateadas = list.map((pregunta, index) => ({
        numero_pregunta: index + 1,
        enunciado: pregunta.enunciado,
        consulta_esperada: pregunta.consulta_esperada,
        nombre_examen: projectName
      }));

      const payload = {
        profe: user?.name,
        nombre_examen_original: originalProjectName,
        nombre_examen: projectName,
        db_asociada: dbAsociada ? dbAsociada.name : dbFileName,
        preguntas: preguntasFormateadas
      };

      formData.append('exam_data', JSON.stringify(payload));

      const response = await fetch('http://localhost:3000/api/update-exam', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Refresh-Token': refreshToken
        },
        body: formData
      });

      if (response.status === 401) {
        localStorage.clear();
        alert('Tu sesión ha expirado');
        navigate('/professorlogin');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Cambios guardados:', data);
        alert('¡Cambios guardados exitosamente!');
        
        setOriginalProjectName(projectName);
      } else {
        const errorData = await response.text();
        setError('Error al guardar cambios');
        console.error('❌ Error:', errorData);
      }

    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      const response = await fetch('http://localhost:3000/api/open-room', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Refresh-Token': refreshToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre_examen: projectName, nombre_db: dbFileName.split(".")[0] })
      });
      
      const data = await response.json();
      localStorage.setItem('roomCode', data.room_key);

      if (response.status === 401) {
        localStorage.clear();
        alert('Tu sesión ha expirado');
        navigate('/professorlogin');
        return;
      }

      if (response.ok) {
        setIsPublished(true);
        alert('¡Examen publicado! Código del examen: ' + data.room_key);

        
      } else {
        alert('Error al publicar el examen');
        
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error de conexión');
    }
  }

  async function handleUnpublish() {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      const response = await fetch('http://localhost:3000/api/close-room', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Refresh-Token': refreshToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre_examen: projectName })
      });

      if (response.status === 401) {
        localStorage.clear();
        alert('Tu sesión ha expirado');
        navigate('/professorlogin');
        return;
      }

      if (response.ok) {
        setIsPublished(false);
        alert('Examen cerrado');
        
      } else {
        alert('Error al despublicar el examen');
          
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error de conexión');
    }
  }

  function handleViewResults() {
    navigate(`/resultados/${projectName}`);
  }

  function handleCancel() {
    
      navigate('/homeprofessor');
    
  }

  if (loading) {
    return <div><h1>Cargando examen...</h1></div>;
  }

  if (error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/homeprofessor')}>Volver</button>
      </div>
    );
  }

  return (
    <>
      <h1 className="main-title">
        {editingName ? 'Editando Examen' : 'Ver Examen'}
        {isPublished && <span >✓ Publicado</span>}
      </h1>
      
      {/* Nombre del examen */}
      <form onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="mi-label">Nombre del examen:</label>
          <input 
            className="Project-Name"
            placeholder="Nombre del examen"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={!editingName || saving}
            style={{ flex: 1 }}
          />
         
        </div>

        {/* Base de datos */}
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="file-upload">
            📁 Base de datos: {dbFileName}
          </label>
          
          {editingDb && (
            <input dbFileName
              id="file-upload"
              type="file"
              accept=".sql"
              onChange={handleFileChange}
              disabled={saving}
              
            />
          )}
          
          
        </div>
      </form>

      
    

      {/* Lista de preguntas */}
      <h2>Preguntas ({list.length})</h2>
      

           
     {/* Botones */}
<div style={{ 
  display: 'flex', 
  gap: '10px', 
  marginTop: '30px',
  flexWrap: 'wrap' 
}}>
  {/* Botón Abrir - deshabilitado si ya está publicado */}
  <button 
    onClick={handlePublish}
    disabled={saving || isPublished} // ← Deshabilitado si está publicado
    style={{
      backgroundColor: isPublished ? '#cccccc' : '#007bff',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: (saving || isPublished) ? 'not-allowed' : 'pointer',
      opacity: isPublished ? 0.5 : 1
    }}
  >
    📢 Abrir Examen
  </button>

  {/* Botón Cerrar - deshabilitado si NO está publicado */}
  <button 
    onClick={handleUnpublish}
    disabled={saving || !isPublished} // ← Deshabilitado si NO está publicado
    style={{
      backgroundColor: !isPublished ? '#cccccc' : '#ffc107',
      color: !isPublished ? '#666' : 'black',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: (saving || !isPublished) ? 'not-allowed' : 'pointer',
      opacity: !isPublished ? 0.5 : 1
    }}
  >
    📤 Cerrar Examen
  </button>
        
        <button 
          onClick={handleCancel}
          disabled={saving}
          
        >
          ← Volver
        </button>
      </div>
    </>
  );
}
