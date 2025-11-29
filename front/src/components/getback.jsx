import { useState, useEffect } from "react";
export default function GetBack() {
   // Señal para sostener los datos de la respuesta
  const [data, setData] = useState(null);
  // Señal para decidir que retornar mientras se espera una respuesta.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/test")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (!data) return <p>Sin datos.</p>;

  return (
    <div>
      <h2>Respuesta del back:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
