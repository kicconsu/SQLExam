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
  const [preguntaActiva, setPreguntaActiva] = useState(0);
  const [resultadoConsulta, setResultadoConsulta] = useState("");
  const [tabla, setTabla] = useState([]);
  const data = JSON.parse(localStorage.getItem("infoexamen"));
  console.log("Datos del examen cargados:", data);
  const enunciados = data.enunciados || [];
  console.log("Preguntas del examen cargadas:", enunciados);
  const preguntaActual = preguntas[preguntaActiva];
  const respuestaActual = respuestas[preguntaActiva] || "";
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
    
    setExamData(data);
    setPreguntas(enunciados);
    setLoading(false);
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
  async function handleSubmitSQL(){
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const nombreDb = localStorage.getItem('nombreDb');
      const enviar ={
        nombre_db: nombreDb,
        query: respuestaActual

      }
      console.log(respuestaActual)
      console.log('📤 Enviando:', enviar);
      const response = await fetch('http://localhost:3000/api/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Refresh-Token': refreshToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enviar)
      });
      
      const queryres = await response.json();
      
      setResultadoConsulta(JSON.stringify(queryres)); 
      console.log("Respuesta bruta del backend:", queryres);
      if (response.ok) {
        console.log('✅ Consulta exitosa:', queryres);
        setTabla(queryres.respuesta);
       
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('Error de conexión');
    }
  }
  
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
        <button onClick={() => navigate('/studentlogin')}>Volver</button>
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
                    {enunciados[preguntaActiva]}
               </div>
                       <div className="pregunta-tabla">
    {tabla && tabla.length > 0 ? (
        <table>
            <thead>
                <tr>
                    {/* Obtener las llaves del primer objeto como headers */}
                    {Object.keys(tabla[0]).map((columna, index) => (
                        <th key={index}>{columna}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {/* Mapear cada fila (diccionario) */}
                {tabla.map((fila, rowIndex) => (
                    <tr key={rowIndex}>
                        {/* Mapear cada valor de la fila */}
                        {Object.values(fila).map((valor, colIndex) => (
                            <td key={colIndex}>{valor}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    ) : (
        <p>No hay datos para mostrar</p>
    )}
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
                <div className="resultado-sql">
                  <h3>Resultado de la consulta:</h3>
                   <pre
                    style={{
                      background: "#1e1e1e",
                      color: "white",
                      padding: "10px",
                      borderRadius: "8px",
                      maxHeight: "200px",
                      overflow: "auto",
                      maxWidth: "100%",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      boxSizing: "border-box",
                    }}
                  >
                    {resultadoConsulta}
                  </pre>
                  
                </div>
            
                <div className="buttons">
                    <button className="btn-primary" onClick={handleEnviarExamen}>
                        Enviar Examen
                    </button>
                    <button className="btn-secondary" onClick={handleSubmitSQL}>
                        Probar Consulta
                    </button>
                </div>
            </div>
        </div>
    );
}