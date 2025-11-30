use std::collections::HashMap;
use std::env;

use axum::{
    extract::{Json, Multipart, Query, State}, // Extractores: con esto accedes a las partes de las peticiones
    http::{header::HeaderMap, StatusCode}, // Para extraer los headers (access_tokens y asi)
    response::IntoResponse, // toda response mandada al front tiene q implementar esto
};

use sqlx::PgPool;

use tokio::io::AsyncWriteExt; // stremear a disco asincronicamente
use tokio::process::Command; // para restaurar la base de datos con un Shell

use serde_json::{Value, json}; // Para manejar JSON arbitrario

use tracing::{info, error};

use crate::{aux_fns::*, models::StudentQuery}; // constructores de responses, constructores de peticiones...
use crate::models::{ExamData, ExamMakerResponse}; // tipado fuerte para los examenes para facilitar validaciones

//la mayoria de los handlers se parecen, ya q solo pasan la peticion tal cual a ROBLE.
//make-exam es muy distinto al necesitar mandar varias peticiones a ROBLE y ademas hablar con posgres.

//Contraseña de test2: aa22A-----
//POST api/login: tratar de logear usuario en ROBLE
pub async fn log_user(Json(payload):Json<Value>) -> impl IntoResponse {
    info!("\nPOST SQLExam/login detectado, credenciales:\n{:?}", &payload);

    let response = 
        post_to("https://roble-api.openlab.uninorte.edu.co/auth/sqlexam_b05c8db1d5/login", payload, "".to_string())
        .await;

    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());
    //no se como loggear el texto del cuerpo lol ES CULPA DE REQWEST AGHH TODO!!!!!!!!!!!11!!!!!
    //info!("respuesta de ROBLE:\nStatus: {:?}\nCuerpo: {:?}", &send_res.status(), &send_res.body());
    send_res
}

// los campos del Body tienen q ser los mismos q salen en la documentacion de ROBLE.
// POST api/register --- por AHORA usa signup-direct
pub async fn reg_user(Json(payload):Json<Value>) -> impl IntoResponse {
    info!("\nPOST SQLExam/register detectado, credenciales:\n{:?}", &payload);

    let response = 
        post_to("https://roble-api.openlab.uninorte.edu.co/auth/sqlexam_b05c8db1d5/signup-direct", payload, "".to_string())
        .await;

    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());
    //info!("respuesta de ROBLE:\nStatus: {:?}\nCuerpo: {:?}", &send_res.status(), &send_res.body());
    send_res
}

//Espera como parametro el nombre del profesor como 'profe',
// GET api/exams
pub async fn gather_exams(Query(payload):Query<Vec<(String, String)>>, heads:HeaderMap) -> impl IntoResponse {

    let mut params:Vec<(String, String)> = [("tableName".to_string(), "Exams".to_string())].to_vec();
    params.append(&mut payload.clone());

    let acc_key:String = token_from_heads(heads);

    info!("\nGET SQLExam/exams detectado,\nparametros: {:?}\naccess_token: {:?}", &params, &acc_key);

    let response =
        get_queried("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/read", params, acc_key)
        .await;
    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());

    send_res
}

/*
    un examen es: {profe, nombre_examen, db_asociada}. toca sacar las preguntas del payload y mandarlo a otra tabla.
    una pregunta es: {numero_pregunta, enunciado, consulta_esperada, nombre_examen, }
    el formato de la peticion tiene q ser:

    {
        "archivo_db": dump.sql,
        "exam_data": {examen}
    }

*/
//POST api/make-exam
pub async fn make_exam(State(admin_pool):State<PgPool>, heads:HeaderMap, mut multipart: Multipart) -> impl IntoResponse {
    info!("POST api/make-exam detectado...");

    //diccionario para manejar los campos que no son archivos
    let mut parts:HashMap<String, String> = HashMap::new();

    //respuesta que marca cuales etapas fueron exitosas y tal
    let mut response_body = ExamMakerResponse::default();

    //La lectura de un multipart es un proceso iterativo hasta terminar con los campos.
    while let Some(mut field) = multipart.next_field().await.unwrap() {
        //Por ahora el archivo queda guardado en el directiorio sea exam_data valido o no. 
        //TODO: mejor validacion de esto ^^^^^^^
        match field.file_name() {
            //Si se manda un archivo, se guarda en file_uploads/
            Some(file_name) => {
                //asegurar que la ruta donde se guardan los .sql exista
                tokio::fs::create_dir_all("file_uploads").await.unwrap();

                //crear el archivo al que se va a stremear la info
                let save_path = format!("file_uploads/{}", file_name);
                let mut file = tokio::fs::File::create(&save_path)
                    .await
                    .unwrap();
                
                //como pueden ser archivos grandes, se opta por "stremearlo" al disco, chunk por chunk
                while let Some(chunk) = field.chunk().await.unwrap() {
                    file.write_all(&chunk).await.unwrap();
                }
                info!("archivo .sql guardado en la ruta: {}", &save_path);
                response_body.file_write = true;
            },
            None => {
                //Si el campo no es un archivo, se añade a un diccionario de datos para ser manejado luego
                let name = field.name().unwrap().to_string();
                parts.insert(name.clone(), field.text().await.unwrap());
                info!("informacion del campo '{}' guardada", name);
            }
        }
    }

    //Extraccion de los datos del examen de manera segura con un pattern match
    let exam:ExamData = match serde_json::from_str(&parts["exam_data"]) {
        Ok(v) => v,
        _ => return {
            error!("Hay algo mal con el formato del exam_data. No falta algún campo?");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(response_body))
        }
    };

    response_body.exam_data = true;

    info!("info del examen cargada: {:?}", &exam);

    //variables para el manejo de archivos
    let db_name = &exam.db_asociada;
    let file_path = format!("file_uploads/{}", db_name);

    //Separacion de datos de examen y preguntas para mandar a sus respectivas tablas
    let exam_body = json!({
        "tableName":"Exams",
        "records": [{
            "profe":exam.profe,
            "nombre_examen":exam.nombre_examen,
            "db_asociada":exam.db_asociada
        }]
    });

    let quest_body = json!({
        "tableName":"Preguntas",
        "records": exam.preguntas
    });

    //Extracción del access_token
    let acc_key:String = token_from_heads(heads);

    //en ROBLE, se guarda la info del examen en Exams, y la info de las preguntas en Preguntas. 
    let res_exam = 
        post_to("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/insert", exam_body, acc_key.clone())
        .await;
    let res_ques =
        post_to("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/insert", quest_body, acc_key)
        .await;

    //si una falla y la otra no lo ideal sería que se limpie la tabla q queda con los datos huerfanos. TODO supongo
    if res_exam.status().is_success() {
        response_body.exam_table_insert = true;
    }
    if res_exam.status().is_success() {
        response_body.questions_table_insert = true;
    }    

    info!("\nSTATUS de Examenes devuelto: {:?}\nSTATUS de Preguntas devuelto: {:?}", &res_exam.status(), &res_ques.status());
    
    //Solo hablar con Posgres si la conversación con Roble salió bien
    if &response_body.exam_table_insert & &response_body.questions_table_insert {
        //ya con los datos en roble, se monta la db del examen a posgres

        // para restaurar la DB del archivo .sql, primero se crea la base de datos que vaya a sostener las tablas
        sqlx::query(&format!("CREATE DATABASE {}", db_name.strip_suffix(".sql").unwrap()))
            .execute(&admin_pool)
            .await
            .unwrap_or_default();
        //^^^^^^^ el deber ser es verificar que la DB ya exista o no antes de crearla. TODO si quieres ser buen ciudadano

        info!("------- DATABASE creada -------");

        //con la db creada, se ejecuta un comando de shell que mande el .sql directamente a la base de datos recien creada
        let db_url = env::var("DB_URL")
            .expect("No se encontró la variable de DB_URL definida en el .env");
        let conn = format!("{}/{}", db_url, db_name.strip_suffix(".sql").unwrap());
        let shell = Command::new("psql")
            .arg("-d")
            .arg(&conn)
            .arg("-f")
            .arg(&file_path)
            .status()
            .await;

        match shell {
            Ok(_e) => response_body.posgres_create = true,
            _ => response_body.posgres_create = false
        }
    }

    //se limpia la carpeta de file_uploads al finalizar la ejecución del handler
    tokio::fs::remove_file(file_path).await.unwrap();


    (StatusCode::MULTI_STATUS, Json(response_body))
}

//espera el código de acceso como un parametro
//regresa el nombre de la base de datos sobre la cual se harán las consultas
//GET api/connect_room
pub async fn connect_room(Query(payload):Query<Vec<(String, String)>>, heads:HeaderMap) -> impl IntoResponse {
    let mut params:Vec<(String, String)> = [("tableName".to_string(), "RoomKeys".to_string())].to_vec();
    params.append(&mut payload.clone());

    let acc_key:String = token_from_heads(heads);

    info!("\nGET SQLExam/exams detectado,\nparametros: {:?}\naccess_token: {:?}", &params, &acc_key);

    let response =
        get_queried("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/read", params, acc_key)
        .await;
    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());

    send_res
}


//las consultas se hacen a posgres, no hace falta mandar nada a roble...
pub async fn query_db(heads:HeaderMap, Json(payload): Json<StudentQuery>) -> impl IntoResponse{
    build_str_res(500, "wip".to_string())
}
