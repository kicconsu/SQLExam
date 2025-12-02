import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../index.css";

export default function ExamStudent() {
  const navigate = useNavigate();
  
  // Estados principales
  const [examData, setExamData] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examFinished, setExamFinished] = useState(false);

  // Cargar examen al montar el componente
  useEffect(() => {
    cargarExamen();
  }, []);

  // Cargar respuestas guardadas del localStorage
  useEffect(() => {
    const stored = localStorage.getItem("respuestasExamen");
    if (stored) {
      setRespuestas(JSON.parse(stored));
    }
  }, []);

  // Función para cargar el examen desde el backend
  async function cargarExamen() {
    setLoading(true);
    const roomCode = localStorage.getItem("roomCode");
    
    if (!roomCode) {
      console.error("❌ No hay roomCode almacenado");
      setError("No se encontró el código de sala");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/connect-room?llave=${roomCode}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      console.log("📋 Respuesta del backend:", data);

      if (response.ok) {
        setExamData(data);
        
        // Extraer preguntas (ajusta según tu estructura)
        const preguntasArray = data.preguntas || data.Preguntas || [];
        console.log("❓ Preguntas extraídas:", preguntasArray);
        
        setPreguntas(preguntasArray);
        
        // Inicializar respuestas vacías si no hay guardadas
        if (Object.keys(respuestas).length === 0) {
          const respuestasIniciales = {};
          preguntasArray.forEach((_, index) => {
            respuestasIniciales[index] = "";
          });
          setRespuestas(respuestasIniciales);
        }
        
      } else {
        console.error("❌ Error del servidor:", data);
        setError("Error al cargar el examen");
      }
      
    } catch (err) {
      console.error("❌ Error de red:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  // Manejar cambio de respuesta y guardar en localStorage
  function handleRespuestaChange(value) {
    const nuevasRespuestas = {
      ...respuestas,
      [currentQuestionIndex]: value
    };
    
    setRespuestas(nuevasRespuestas);
    localStorage.setItem("respuestasExamen", JSON.stringify(nuevasRespuestas));
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

  // Ir a una pregunta específica
  function irAPregunta(index) {
    setCurrentQuestionIndex(index);
  }

  // Enviar examen completo
  async function handleEnviarExamen() {
    if (window.confirm('¿Estás seguro de enviar el examen? No podrás modificar tus respuestas.')) {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const user = JSON.parse(localStorage.getItem('user'));
        const roomCode = localStorage.getItem('roomCode');

        if (!token) {
          alert('Tu sesión ha expirado');
          navigate('/studentlogin');
          return;
        }

        // Formatear respuestas para el backend
        const respuestasFormateadas = preguntas.map((pregunta, index) => ({
          numero_pregunta: index + 1,
          enunciado: pregunta.enunciado,
          respuesta_estudiante: respuestas[index] || "",
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
            'X-Refresh-Token': refreshToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 401) {
          localStorage.clear();
          alert('Tu sesión ha expirado');
          navigate('/studentlogin');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Examen enviado:', data);
          
          // Limpiar respuestas guardadas
          localStorage.removeItem('respuestasExamen');
          
          alert('¡Examen enviado exitosamente!');
          setExamFinished(true);
          
          // Redirigir a resultados
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

  // ===== PANTALLAS DE ESTADO =====

  if (loading && !examData) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>⏳ Cargando examen...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/studentlogin')}>Volver</button>
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>⚠️ No hay preguntas disponibles</h2>
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

  // ===== RENDER PRINCIPAL =====

  const preguntaActual = preguntas[currentQuestionIndex];
  const respuestaActual = respuestas[currentQuestionIndex] || "";
  const preguntasRespondidas = Object.values(respuestas).filter(r => r.trim() !== "").length;

  return (
     <div className="examen-container">

            {/* Panel de preguntas */}
            <div className="preguntas-panel">
                <div className="preguntas-tabs">
                    {enunciados.map((_, index) => (
                        <button
                            key={index}
                            className={
                                "pregunta-tab " + (preguntaActiva === index ? "active" : "")
                            }
                            onClick={() => setPreguntaActiva(index)}
                        >
                            Pregunta {index + 1}
                        </button>
                    ))}
                </div>

                <div className="pregunta-enunciado">
                    {enunciados[preguntaActiva].enunciado}
                </div>

                <div className="pregunta-tabla">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Edad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockTabla.map((fila, index) => (
                                <tr key={index}>
                                    <td>{fila.nombre}</td>
                                    <td>{fila.edad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Panel SQL */}
            <div className="sql-panel">
                <textarea
                    className="sql-input"
                    placeholder="Escribe tu código SQL aquí"
                    value={respuestaActual}
                    onChange={(e) => handleRespuestaChange(e.target.value)}
                />

                <div className="buttons">
                    <button className="btn-primary" onClick={enviarExamen}>
                        Enviar Examen
                    </button>
                    <button className="btn-secondary" onClick>
                        Probar Consulta
                    </button>
                </div>
            </div>
        </div>
    );
}