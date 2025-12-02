use std::{collections::HashMap, sync::{Arc, Mutex}};

use serde::{Deserialize, Serialize};
use sqlx::{Postgres, pool::Pool};

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

#[derive(Deserialize, Debug)]
pub struct StudentQuery {
    pub nombre_db: String,
    pub query: String
}

//Con este modelo se guarda el estado de la aplicacion
//Por ahora, el estado solo involucra un diccionario de la forma {"nombre_db": Pool}
#[derive(Default, Clone, Debug)]
pub struct AppState {
    pub db_pools: Arc<Mutex<HashMap<String, Pool<Postgres>>>>
}