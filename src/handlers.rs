use std::collections::HashMap;
use std::{env};
use rand::distr::{Alphanumeric, SampleString};

use axum::{
    extract::{Json, Multipart, Query, State}, // Extractores: con esto accedes a las partes de las peticiones
    http::{header::HeaderMap, StatusCode}, // Para extraer los headers (access_tokens y asi)
    response::IntoResponse, // toda response mandada al front tiene q implementar esto
};

use sqlx::{PgPool};
use sqlx_pgrow_serde::SerMapPgRow;

use tokio::io::AsyncWriteExt; // stremear a disco asincronicamente
use tokio::process::Command; // para restaurar la base de datos con un Shell

use serde_json::{Value, json}; // Para manejar JSON arbitrario

use tracing::{info, error};

use crate::aux_fns::*; // constructores de responses, constructores de peticiones...
use crate::models::{AppState, ExamData, ExamMakerResponse, StudentQuery}; // tipado fuerte para los examenes para facilitar validaciones

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
    //no se como loggear el texto del cuerpo lol ES CULPA DE REQWEST AGHH TODO: !!!!!!!!!!!11!!!!!
    //info!("respuesta de ROBLE:\nStatus: {:?}\nCuerpo: {:?}", &send_res.status(), &send_res.body());
    send_res
}

// los campos del Body tienen q ser los mismos q salen en la documentacion de ROBLE.
// POST api/register --- por AHORA usa signup-direct (TODO: cambiar pls)
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
pub async fn make_exam(State(app_state):State<AppState>, heads:HeaderMap, mut multipart: Multipart) -> impl IntoResponse {
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
                
                //como pueden ser archivos grandes, se opta por "streamearlo" al disco, chunk por chunk
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
        let admin_pool: PgPool;
        {   
            let state_pools = app_state.db_pools.lock().unwrap();
            admin_pool = match state_pools.get("admin") {
                Some(p) => p.clone(),
                None => {
                    error!("pool de admin no encontrada en el Estado de la app. what the hell");
                    return(StatusCode::INTERNAL_SERVER_ERROR, Json(response_body));
                }
            }
        }
        sqlx::query(&format!("CREATE DATABASE {}", db_name.strip_suffix(".sql").unwrap()))
                .execute(&admin_pool)
                .await
                .unwrap_or_default();
        //^^^^^^^ el deber ser es verificar que la DB ya exista o no antes de crearla. TODO si quieres ser buen ciudadano

        info!("------- DATABASE creada -------");

        //con la db creada, se ejecuta un comando de shell que mande el .sql directamente a ella
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

//borrar un examen involucra quitarlo de roble y quitar su base de datos de posgres con un par de consultas
//espera el nombre del examen en el body:
/*
    {
        "nombre_examen":"examen de JOIN"
    }
*/
//DELETE api/delete-exam
pub async fn delete_exam(State(app_state):State<AppState>, heads:HeaderMap, Json(payload): Json<Value>) -> impl IntoResponse {
    info!("api/delete-exam detectado... tratando de remover el examen de la tabla Exams");

    let nombre_examen = match payload.get("nombre_examen") {
        Some(nombre) => nombre.to_string().replace("\"", ""),
        None => {
            error!("No se encontró el campo 'nombre_examen' en la petición. Hazlo bien pls!!!!!!!!");
            return (StatusCode::BAD_REQUEST, Json(json!("El cuerpo de la petición no parece poseer el campo 'nombre_examen'")));
        }
    };

    let body = json!({
        "tableName":"Exams",
        "idColumn":"nombre_examen",
        "idValue":&nombre_examen
    });

    let acc_key = token_from_heads(heads);

    let delete_response = delete_from("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/delete", body, acc_key)
        .await;
    if !delete_response.status().is_success() {
        let res_body = delete_response.text().await.unwrap();
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
            "ERROR":"Roble no aceptó la eliminación del examen.",
            "msg_roble":res_body
        })));
    }

    let delete_body = match delete_response.json::<Value>().await {
        Ok(bod) => bod,
        Err(e) => {
            error!("La extraccion del cuerpo de la respuesta de roble salio mal: {}", e.to_string());
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Algo salió mal en el backend. Revisa la consola!!")));
        }
    };
    
    let db_name:String = match delete_body[0].get("db_asociada") {
        Some(name) => name.to_string().strip_suffix(".sql").unwrap().to_owned().replace("\"", ""),
        None => {
            error!("No se encontró el campo 'db_asociada' en la respuesta de roble. lol");
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Error del backend. Revisa la consola.")));
        }
    };

    info!("examen borrado de ROBLE, tratando de eliminar db de Postgres...");

    let admin_pool:PgPool;
    {
        let state_pools = app_state.db_pools.lock().unwrap();
        admin_pool = match state_pools.get("admin"){
            Some(p) => p.clone(),
            None => {
                error!("de alguna manera, la pool de admin no se encontró en el Estado. esto no debería de ser posible.");
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Error interno del backend. revisa la consola!!!")));
            }
        }
    }
    /*
    
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'your_database_name';

    DROP DATABASE your_database_name;

    */
    let query_res = match sqlx::raw_sql(&format!("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{}'; DROP DATABASE {}", db_name, db_name))
                .execute(&admin_pool)
                .await {

                    Ok(result) => result,
                    Err(e) => {
                        error!("pues algo salió mal con la consulta a Postgres.\n{}\n", e.to_string());
                        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Error interno del backend. revisa la consola!")));
                    }
                };
    //con esto se supone que la db fué eliminada.
    info!("Db eliminada!, respuesta de Postgres: {:?}", query_res);

    return (StatusCode::OK, Json(json!("Examen eliminado!")));
} 

//espera el código de acceso como un parametro
//regresa el nombre de la base de datos sobre la cual se harán las consultas
//GET api/connect-room
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



//las consultas se hacen a posgres, no hace falta mandar nada a roble... creo
//una StudentQuery es un json de la forma:
/*
    {
        nombre_db: "database_ejemplo",
        query: "SELECT * FROM..."
    }
*/
//para hacer una busqueda toca saber a cual Pool mandarle.
//las Pool activas se guardan en la app_state. (definición de AppState en models.rs)
//al buscar en app_state.db_pools["database_ejemplo"] se obtiene la pool de la database con ese nombre.
//claramente, dos database distintas no pueden tener el mismo nombre. igual en posgreSQL tampoco se pueden crear DB del mismo nombre.
//TODO: está pendiente validar esto ^^^^^^^
//POST api/query
pub async fn query_db(State(app_state):State<AppState>, _heads:HeaderMap, Json(payload): Json<StudentQuery>) -> impl IntoResponse {
    info!("POST api/query detectado");

    //en realidad los Pools son referencias a un SharedPool interno de sqlx.
    //es decir, los clones de Pool que se sacan del AppState son clones de referencias, no de las conexiones reales a posgres.
    //por lo que lo siguiente es el deber ser:
    let db_pool: PgPool; 
    {
        let state_pools = app_state.db_pools.lock().unwrap();
        db_pool = match state_pools.get(&payload.nombre_db) {
            Some(pool) => pool.clone(), //toca clonar aca para apaciguar a los dioses del thread-safety (no se peude usar .await dentro de un bloque mutex)
            None => {
                let err_msg = "Trató de hacer una busqueda en una base de datos, pero esta no se encuentra en el estado del servidor.";
                error!(err_msg);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"ERROR": err_msg})))
            }
        };
    }

    //TODO: problemillas de memoria. raw_sql + fetch_all busca hacerlo de un arranque. quizas si lo trato como Stream y limito hasta donde se lee...
    let query_result = match sqlx::raw_sql(&payload.query)
        .fetch_all(&db_pool)
        .await {
            Ok(rows) => rows,
            Err(e) => {
                let err_msg = "Hay un problema con esta consulta.";
                error!(err_msg);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                    "ERROR": err_msg,
                    "Posgres Dice":e.to_string()
                    .strip_prefix("error returned from database: ")
                })))
            }
        };
    
    //el resultado de la busqueda puede ser literalmente lo que sea, entonces toca manejar JsonValues arbitrarios.
    //para eso se usa sqlx-pgrow-serde. el problema es que ese crate es solo compatible con sqlx 0.7, y esa version será incompatible con rust pronto.
    //entonces, IDEALMENTE, TODO: implementarias las conversiones de los tipos de posgres -> JsonValue para que estén al dia. aunque sea pasarlas a String
    //mientras tanto, as of rust 1.91.0, esta app es compatible.
    let query_response:Vec<SerMapPgRow> = query_result.into_iter()
            .map(|row| {SerMapPgRow::from(row)})
            .collect();
    
    info!("respuesta obtenida de posgres! mandandola...");

    return (StatusCode::OK, Json(json!({
        "respuesta":query_response
    })))
}

//abrir un cuarto involucra añadir un Pool al diccionario de la AppState. Con este pool se harán todas las consultas de los estudiantes.
/*
    el cuerpo tiene que ser asi:
    {
        nombre_examen:"examen JOIN",
        nombre_db:"join_db"
    }
    recuerda el access_token en el header!!
*/
//POST api/open-room
pub async fn open_room(State(app_state):State<AppState>, heads:HeaderMap, Json(payload): Json<Value>) -> impl IntoResponse {
    info!("POST api/open-room detectado");
    let ex_name = match payload.get("nombre_examen") {
        Some(name) => name.to_string().replace("\"", ""),
        None => {
            error!("nombre_examen no encontrado en el cuerpo de la solicitud.");
            return (StatusCode::BAD_REQUEST, Json(json!("Trató de abrir un room, pero en la solicitud no se encontró el nombre del examen.\nAsegurese de que el campo sea 'nombre_examen', no 'nombreExamen'!")))
        }
    };

    let db_name = match payload.get("nombre_db") {
        Some(name) => name.to_string().replace("\"", ""),
        None => {
            error!("nombre_db no encontrado en el cuerpo de la solicitud.");
            return (StatusCode::BAD_REQUEST, Json(json!("Trató de abrir un room, pero en la solicitud no se encontró el nombre de la db.\nAsegurese de que el campo sea 'nombre_db', no 'nombreDb'!")))
        }
    };

    let acc_key = token_from_heads(heads);

    //TODO: toca verificar q no se repita la llave. seria solo necesario si se lleva a un contexto de produccion. mientras, las probabilidades son bajas...
    let room_key = Alphanumeric.sample_string(&mut rand::rng(), 5);

    //un cuarto es entonces la asociacion de db_name - examen - key
    //cuando un estudiante busca conectarse, consigue el db_name
    //cuando un profesor cierra, lo hace buscando por nombre_examen
    let body = json!({
        "tableName":"RoomKeys",
        "records":[
            {"nombre_db":db_name, "nombre_examen":ex_name, "llave":room_key}
        ]
    });

    info!("Insertando en tabla RoomKeys en Roble: {}", &body);

    let response = post_to("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/insert", body, acc_key)
        .await;
    
    if !response.status().is_success() {
        let res_body = response.text().await.unwrap();
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
            "ERROR":"Roble no aceptó la creación de la sala.",
            "msg_roble":res_body
        })));
    }

    info!("Roble aceptó!");
    
    let db_url = match env::var("DB_URL"){
        Ok(url) => url,
        _ => {
            error!("No se encontró DB_URL en el .env, asi que no es posible conectarse con posgres.");
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Error interno del backend. revisa la consola!")))
        }
    };

    info!("tratando de conectar a posgres en: {}/{}", &db_url, &db_name);
        
    let pool = match PgPool::connect(&format!("{}/{}", db_url, db_name)).await {
        Ok(p) => p,
        Err(e) => {
            let err_msg = format!("Posgres negó la conexión por alguna razón: {}", e);
            error!(err_msg);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Error interno del backend. revisa la consola!")))
        }
    };

    info!("Conexión con posgres abierta!");

    {
        let mut pools = app_state.db_pools.lock().unwrap();
        pools.insert(db_name, pool);
    }

    info!("Examen realizado con exito!\nEstado actual: {:?}", &app_state.db_pools);

    return (StatusCode::OK, Json(json!({
        "room_key":room_key
    })))
}

//pa cerrar un examen toca cerrar la pool y quitarla del estado, y quitar la fila en roble.
/*
    el cuerpo de la peticion se tiene que ver asi:
    {
        nombre_examen:"examen JOIN"
    }
*/
//POST api/close-room
pub async fn close_room(State(app_state):State<AppState>, heads:HeaderMap, Json(payload):Json<Value>) -> impl IntoResponse {
    info!("POST api/close-room detectado");
    // GET a roble para sacar el nombre de la db, se accede al State con ese nombre, y luego DELETE a roble con el examen.
    // tecnicamente hay una consulta demás pero si el DELETE va de primero entonces si hay un fallo en postgres (que es probable) o en el estado
    // entonces se borra en Roble y queda el Pool abierto
    let examen = match payload.get("nombre_examen") {
        Some(nombre) => nombre.to_string().replace("\"", ""),
        None => {
            error!("Solicitud mala. No contiene 'nombre_examen' en el cuerpo.");
            return (StatusCode::BAD_REQUEST, Json(json!("Solicitud mala. No contiene 'nombre_examen' en el cuerpo.")));
        }
    };

    info!("nombre examen conseguido, tratando de conseguir nombre_db...");

    //para conseguir el nombre de la db se hace una busqueda a ROBLE...
    let params:Vec<(String, String)> = [("tableName".to_string(), "RoomKeys".to_string()),
                                        ("nombre_examen".to_string(), examen)].to_vec();

    let acc_key = token_from_heads(heads);
    let db_search = get_queried("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/read", params, acc_key.clone())
        .await;

    //esta busqueda tiene que dar un arreglo de jsons as per la documentacion de ROBLE
    let search_body = match db_search.json::<Value>().await {
        Ok(b) => b,
        Err(e) => {
            error!("Algo salió mal extrayendo la respuesta de ROBLE:\n{}", e.to_string());
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Problemas en el backend. Mira la consola...")));
        }
    };

    //como es un arreglo toca usar el primer elemento y tirar el get im pretty sure
    let db = match search_body[0].get("nombre_db") {
        Some(name) => name.to_string().replace("\"", ""),
        None => {
            error!("nombre_db no estaba presente en la respuesta de roble");
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!("Problemas en el backend. Mira la consola...")));
        }
    };

    info!("tratando de remover db: {} del Estado.\nEstado: {:?}", &db, &app_state);

    //ya con el nombre de la db se puede buscar la pool asociada a esa db para cerrarla
    //let f: bool;
    let pool: PgPool;
    {
        let mut state_pools = app_state.db_pools.lock().unwrap();
        pool = match state_pools.remove(&db) {
            Some(p) => {
                //f = true;
                p.clone()
            },
            None => {
                error!("La base de datos no se encuentra en el Estado de la aplicación. Estas tratando de cerrar un examen que no ha sido iniciado? Eso o el nombre de la db en roble está mal escrito.");
                //f = false;
                return (StatusCode::BAD_REQUEST, Json(json!("La base de datos no se encuentra en el Estado de la aplicación. Estas tratando de cerrar un examen que no ha sido iniciado? Eso o el nombre de la db en roble está mal escrito.")));
            }
        };
    }
    pool.close().await;
    /*if !f {
        return (StatusCode::BAD_REQUEST, Json(json!("La base de datos no se encuentra en el Estado de la aplicación. Estas tratando de cerrar un examen que no ha sido iniciado? Eso o el nombre de la db en roble está mal escrito.")));
    }*/
    info!("Pool removida del Estado exitosamente, tratando de remover registro en Roble...");

    //se tira el DELETE a roble para borrar el cuarto de ese examen. hay un ligero problema y es que significa que
    //varios examenes NO pueden usar la misma db. TODO: estoy casi seguro de que no tiene por qué ser asi. si da el tiempo, figure something out
    let body = json!({
        "tableName":"RoomKeys",
        "idColumn":"nombre_db",
        "idValue":db
    });

    let response = delete_from("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/delete", body, acc_key)
        .await;

    if !response.status().is_success() {
        let res_body = response.text().await.unwrap();
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
            "ERROR":"Roble no aceptó la eliminación de la sala.",
            "msg_roble":res_body
        })));
    }

    info!("Roble aceptó! Sesion de examen terminada exitosamente.");

    return (StatusCode::OK, Json(json!("Sesión de examen terminada exitosamente")));
}
