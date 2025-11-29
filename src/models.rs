use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct ExamData {
    pub profe: String,
    pub nombre_examen: String,
    pub db_asociada: String,
    pub preguntas: Vec<Pregunta>
}
#[derive(Deserialize, Serialize, Debug, Clone, Default)]
pub struct Pregunta{
    numero_pregunta: i32,
    enunciado: String,
    consulta_esperada: String,
    nombre_examen: String
}

#[derive(Serialize, Default)]
pub struct ExamMakerResponse {
    pub file_write: bool,
    pub exam_data: bool,
    pub exam_table_insert: bool,
    pub questions_table_insert: bool,
    pub posgres_create: bool
}