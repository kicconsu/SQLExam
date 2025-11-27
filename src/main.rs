use axum::{
    http::{HeaderValue, Method, header::HeaderMap}, //Para CORS y armar Responses
    routing::{get, post},
    extract::{Query, Json}, //Extractores de peticiones
    response::IntoResponse // Para retornar Responses de las bases de datos
};

use tracing::info; // logging
use tracing_subscriber::FmtSubscriber;

use serde_json::{Value, json}; // Para manejar JSON arbitrario
use tower_http::cors::CorsLayer; // Para comunicar front y back
//todo: tower_http::services::ServeDir para que Axum sirva la app... (for production)

mod aux_fns;
use crate::aux_fns::*;


#[tokio::main]
async fn main(){
    //Setup para poder usar la macro info!
    tracing::subscriber::set_global_default(FmtSubscriber::default()).unwrap();

    //App de axum con sus rutas y la capa de CORS para poder manejar las queries que lleguen del front
    let app = axum::Router::new()
        .route("/api/login", post(log_user))
        .route("/api/register", post(reg_user))
        .route("/api/exams", get(gather_exams))
        .route("/api/make-exam", post(make_exam))
        .layer(CorsLayer::new()
                .allow_headers(tower_http::cors::Any) //averigua como solo permitir ciertos headers
                .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
                .allow_methods([Method::GET, Method::POST]));

    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap();

    info!("API funcionando...!");

    axum::serve(listener, app)
        .await
        .unwrap();
}

//Contraseña de test2: aa22A-----
//POST api/login: tratar de logear usuario en ROBLE
async fn log_user(Json(payload):Json<Value>) -> impl IntoResponse {
    info!("\nPOST SQLExam/login detectado, credenciales:\n{:?}", &payload);

    let response = 
        post_to("https://roble-api.openlab.uninorte.edu.co/auth/sqlexam_b05c8db1d5/login", payload, "".to_string())
        .await;

    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());
    //no se como loggear el texto del cuerpo lol
    //info!("respuesta de ROBLE:\nStatus: {:?}\nCuerpo: {:?}", &send_res.status(), &send_res.body());
    send_res
}

async fn reg_user(Json(payload):Json<Value>) -> impl IntoResponse {
    info!("\nPOST SQLExam/register detectado, credenciales:\n{:?}", &payload);

    let response = 
        post_to("https://roble-api.openlab.uninorte.edu.co/auth/sqlexam_b05c8db1d5/signup-direct", payload, "".to_string())
        .await;

    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());
    //no se como loggear el texto del cuerpo lol
    //info!("respuesta de ROBLE:\nStatus: {:?}\nCuerpo: {:?}", &send_res.status(), &send_res.body());
    send_res
}

//Espera como parametros el nombre del examen y el nombre del profesor
async fn gather_exams(Query(payload):Query<Vec<(String, String)>>, heads:HeaderMap) -> impl IntoResponse {

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

//un examen es: {profe, nombre_examen, db_asociada}
async fn make_exam(heads:HeaderMap, Json(payload):Json<Value>) -> impl IntoResponse {
    info!("\nPOST SQLExam/make_exam detectado, examen a crear:\n{:?}", &payload);

    let body = json!({
        "tableName":"Exams",
        "records": payload
    });

    let acc_key:String = token_from_heads(heads);

    let response = 
        post_to("https://roble-api.openlab.uninorte.edu.co/database/sqlexam_b05c8db1d5/insert", body, acc_key)
        .await;
    let send_res = build_ax_response(response).await;

    info!("STATUS devuelto: {:?}", &send_res.status());
    send_res
}