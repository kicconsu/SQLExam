import { useState } from "react";
import "../CSS/ProfessorExam.css";
import ProfessorLogin from "./ProfessorLogin";
import { useNavigate } from 'react-router-dom';
export default function ProfessorExam() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [list, setList] = useState([]);
  const [editbtn, setEditbtn] = useState(false);
  const [profe, setProfe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [dbAsociada, setDbAsociada] = useState(null); 
  const [dbFileName, setDbFileName] = useState(''); 

  
  function addQuestion(e) {
    e.preventDefault(); // evita que el form haga refresh

    if (question.trim() === '' || answer.trim() === '') {
      alert("Please write question and answer");
        
      return;
    }
    const newItem = { 
        enunciado: question,
        consulta_esperada: answer
      };

    setList([...list, newItem]);

    setQuestion("");
    setAnswer("");
  }
  function editItem(index) {
    setEditingIndex(index); 
  setQuestion(list[index].enunciado);
  setAnswer(list[index].consulta_esperada);
}
  function deleteItem(index) {
    setList(list.filter((_, i) => i !== index));
} 
 function handleFileChange(e) {
    const file = e.target.files[0];
    
    if (file) {
      // Validar que sea un archivo .bak
      if (!file.name.endsWith('.sql')) {
        alert('Por favor selecciona un archivo .sql');
        e.target.value = ''; // Limpiar el input
        return;
      }
      
      setDbAsociada(file);
      setDbFileName(file.name);
      console.log(' Archivo seleccionado:', file.name);
    }
  } 
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
        nombre_examen: projectName,
        db_asociada: dbAsociada.name,
        preguntas: preguntasFormateadas
      };

      
      formData.append('exam_data', JSON.stringify(payload));
      // Ennvio al backend HOLAAAAAAAAA
      const response = await fetch('http://localhost:3000/api/make-exam', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          
        },
        body: formData
      });

      const data = await response.text();

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

  function handleCancel() {
    if (window.confirm('¿Seguro que quieres cancelar? Se perderán los cambios.')) {
      navigate('/homeprofessor');
    }
  }

return (
    <>
      <h1 className="main-title">New Exam</h1>
      
      
      <form onSubmit={(e) => e.preventDefault()}>
        <input 
          className="Project-Name"
          placeholder="Nombre del examen"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={loading}
        />
        
        {/* INPUTARCHIVO */}
        
          <label 
            htmlFor="file-upload" 
            
          >
            📁 Seleccionar archivo .sql
          </label>
          
          <input 
            id="file-upload"
            type="file"
            accept=".sql"
            onChange={handleFileChange}
            disabled={loading}
            
          />
          
          {dbFileName && (
            <div style={{ marginTop: '10px' }}>
              <strong>Archivo seleccionado:</strong> {dbFileName}
            </div>
          )}
        
      </form>
      
      
      <form onSubmit={addQuestion}>
        <input
          className="question-item"
          placeholder="Enunciado de la pregunta"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <input
          className="answer-item"
          placeholder="Consulta esperada (respuesta)"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <input type="submit" id="submit_button" value="Agregar Pregunta" />
      </form>

      <h2>Lista de Preguntas</h2>
      <ul>
        {list.map((item, index) => (
          <li key={index}>
            <label>
              <span className="question-item">
                {index + 1}. {item.enunciado}
              </span>
              <span className="answer-item">
                Respuesta: {item.consulta_esperada}
              </span>
            </label>

            <span
              className="edit-btn"
              onClick={() => {
                const update = prompt("Editar enunciado:", item.enunciado);
                const update2 = prompt("Editar consulta esperada:", item.consulta_esperada);
                if (update !== null && update2 !== null) {
                  const newList = [...list];
                  newList[index].enunciado = update; 
                  newList[index].consulta_esperada = update2;
                  setList(newList);
                }
              }}
            >
              Edit
            </span>
            
            <span className="delete-btn" onClick={() => deleteItem(index)}>
              Delete
            </span>
          </li>
        ))}
      </ul>
      
      <p>Total de preguntas: <span>{list.length}</span></p>

     
      

      <div >
        <button 
          onClick={handleSaveExam}
          disabled={loading}
          
        >
          {loading ? 'Guardando...' : 'Guardar Examen'}
        </button>
        
        <button 
          onClick={handleCancel}
          disabled={loading}
          
        >
          Cancelar
        </button>
      </div>
    </>
  );
}