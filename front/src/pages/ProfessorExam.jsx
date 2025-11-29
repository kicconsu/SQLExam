import { useState } from "react";
import "../CSS/ProfessorExam.css";

export default function ProfessorExam() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [list, setList] = useState([]);
  const [editbtn, setEditbtn] = useState(false);

  function addQuestion(e) {
    e.preventDefault(); // evita que el form haga refresh

    if (!question.trim() || !answer.trim()) {
      alert("Please write question and answer");
      return;
    }

    setList([...list, { q: question, a: answer }]);

    setQuestion("");
    setAnswer("");
  }
  function editItem(index) {
    setEditingIndex(index); // guardar qué item editas
    setQuestion(list[index].q);
    setAnswer(list[index].a);
}
  function deleteItem(index) {
    setList(list.filter((_, i) => i !== index));
}  

  return (
    
    <>
      <h1 className="main-title">New Exam</h1>

      <form onSubmit={addQuestion}>
        <input
          className="question-item"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <input
          className="answer-item"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <input type="submit" id="submit_button" value="Submit" />
      </form>

      <h2>Task List</h2>
     <ul>
  {list.map((item, index) => (
    <li key={index}>
      <label>
        <span className="question-item">{item.q}</span>
        <span className="answer-item">{item.a}</span>
      </label>

      <span
  className="edit-btn"
  onClick={() => {
    const update = prompt("Edit question:", item.q);
    const update2 = prompt("Edit answer:", item.a);
    if (update !== null) {
      const newList = [...list];
      newList[index].q = update; 
      newList[index].a = update2;
      setList(newList);
    }
  }}
>
  Edit
</span>
      <span className="delete-btn" onClick={() => deleteItem(index)}>Delete</span>
    </li>
  ))}
</ul>
      Preguntas: <span>{list.length}</span>
    </>

    
  );
}
