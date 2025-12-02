import { useState } from "react";
import "../CSS/ProfessorExam.css";
import ProfessorLogin from "./ProfessorLogin";
import { useNavigate } from 'react-router-dom';
export default function ExamStudent() {
  const navigate = useNavigate();
   const [examData, setExamData] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({}); // Guarda las respuestas del estudiante
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examFinished, setExamFinished] = useState(false);

  
  useEffect(() => {
    cargarExamen();
  }, []);
  
  async function handleExam(e) {
    
    e.preventDefault(); // evita que el form haga refresh
   

    const roomCode = localStorage.getItem("roomCode");
    if (!roomCode) {
      console.error("No hay roomCode almacenado");
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/exam-info/${roomCode}`, { //esta direccion puede varias confirma plis
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
        
  
         // Extrae las preguntas del objeto data
        // Ajusta según la estructura que devuelva tu backend
        const preguntasArray = data.preguntas || data.Preguntas || [];
        console.log("❓ Preguntas extraídas:", preguntasArray);
setPreguntas(preguntasArray);
        
        // Inicializar respuestas vacías para cada pregunta
        const respuestasIniciales = {};
        preguntasArray.forEach((_, index) => {
          respuestasIniciales[index] = "";
        });
        setRespuestas(respuestasIniciales)
        
      
      } else {
       
        console.error("Error del servidor:", data);
      }
      
    } catch (err) {
      console.error("Error de red:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  
    
  }
   function handleRespuestaChange(value) {
    setRespuestas({
      ...respuestas,
      [currentQuestionIndex]: value
    });
  }

  // Ir a la siguiente pregunta
  function handleSiguiente() {
    if (currentQuestionIndex < preguntas.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  // Ir a la pregunta anterior
  function handleAnterior() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }
  // Enviar examen completo
  async function handleEnviarExamen() {
    if (window.confirm('¿Estás seguro de enviar el examen? No podrás modificar tus respuestas.')) {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const roomCode = localStorage.getItem('roomCode');

        // Formatear respuestas para enviar al backend
        const respuestasFormateadas = preguntas.map((pregunta, index) => ({
          numero_pregunta: index + 1,
          enunciado: pregunta.enunciado,
          respuesta_estudiante: respuestas[index],
          consulta_esperada: pregunta.consulta_esperada
        }));

        const payload = {
          estudiante: user?.name,
          roomCode: roomCode,
          nombre_examen: examData?.nombre_examen,
          respuestas: respuestasFormateadas
        };

        const response = await fetch('http://localhost:3000/api/submit-exam', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Examen enviado:', data);
          alert('¡Examen enviado exitosamente!');
          setExamFinished(true);
          
          // Redirigir a resultados o home
          navigate('/resultados-estudiante');
        } else {
          alert('Error al enviar el examen');
        }

      } catch (err) {
        console.error('❌ Error:', err);
        alert('Error de conexión');
      } finally {
        setLoading(false);
      }
    }
  }

  // Pantallas de loading/error
  if (loading && !examData) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Cargando examen...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/student-home')}>Volver</button>
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>No hay preguntas disponibles</h2>
        <button onClick={() => navigate('/student-home')}>Volver</button>
      </div>
    );
  }

  if (examFinished) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>✅ Examen completado</h2>
        <p>Tus respuestas han sido enviadas exitosamente</p>
        <button onClick={() => navigate('/resultados-estudiante')}>Ver resultados</button>
      </div>
    );
  }

  // Pregunta actual
  const preguntaActual = preguntas[currentQuestionIndex];
  const respuestaActual = respuestas[currentQuestionIndex] || "";
  async function handleSaveExam(e) {
    
    // Validaciones
    if (!projectName.trim()) {
      alert('Por favor ingresa el nombre del examen');
      return;
    }
    if (!dbAsociada ) {
      alert('Por favor selecciona un archivo .sql');
      return;
    }

    if (list.length === 0) {
      alert('Por favor agrega al menos una pregunta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const formData = new FormData();
      if (!token) {
      console.error('❌ No hay token - redirigiendo al login');
      navigate('/professorlogin'); // Cambia '/login' por tu ruta de login
      return;
    }
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
        nombre_examen: projectName,
        db_asociada: dbAsociada.name,
        preguntas: preguntasFormateadas,
        num_preguntas: list.length
      };

      
      formData.append('exam_data', JSON.stringify(payload));
      // Ennvio al backend HOLAAAAAAAAA
      const response = await fetch('http://localhost:3000/api/make-exam', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
           'X-Refresh-Token': refreshToken
          
        },
        body: formData
      });

      const data = await response.text();
      if (response.status === 401) {
      console.error('❌ Token expirado - limpiando sesión');
    
      alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      navigate('/professorlogin'); 
      return;
    }
      if (response.ok) {
        console.log('✅ Examen creado exitosamente:', data);
        alert('¡Examen creado exitosamente!');
        navigate('/homeprofessor');
        
        
      } else {
        setError(data.message || 'Error al crear el examen');
        console.error('❌ Error del servidor:', data);
      }

    } catch (err) {
      console.error('❌ Error de red:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

return (
    <>
      <h1 className="main-title">New Exam</h1>
      <hr />
      <h2>Pregunta</h2>
      <ul>
      
        <textarea
    className="big-textarea"
    value={descripcion}
    onChange={(e) => setDescripcion(e.target.value)}
    placeholder="Escribe aquí tu texto..."
  />
      </ul>
      <button className="next">Siguiente pregunta</button>
      <div className="index"> 1 de 5 preguntas</div>
      
    </>
  );
}