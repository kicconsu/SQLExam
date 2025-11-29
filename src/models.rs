use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ExamData {
    pub profe: String,
    pub nombre_examen: String,
    pub db_asociada: String,
    pub preguntas: Vec<Pregunta>
}
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Pregunta{
    numero_pregunta: i32,
    enunciado: String,
    consulta_esperada: String,
    nombre_examen: String
}