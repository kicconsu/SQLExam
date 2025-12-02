use axum::{
    extract::DefaultBodyLimit,
    http::{HeaderValue, Method},
    routing::{delete, get, post} // Para retornar Responses de las bases de datos
};

use tracing::info; // logging
use tracing_subscriber::FmtSubscriber;

use tower_http::cors::CorsLayer; // Para permitir la llegada de las peticiones del front
//TODO: tower_http::services::ServeDir para que Axum sirva la app... (for production)

use dotenv::dotenv;
use std::env;
use sqlx::{PgPool};

mod aux_fns;
mod models;
mod handlers;

use crate::{handlers::*, models::AppState};

#[tokio::main]
async fn main() -> Result<(), sqlx::Error>{
     //Setup para poder usar la macro info!
    tracing::subscriber::set_global_default(FmtSubscriber::default()).unwrap();

    //Setup de la conexión con posgreSQL
    dotenv().ok(); //En el .env se guardan variables como la direccion a la db_admin

    let global_state = AppState::default();

    let admin_db_url = env::var("ADMIN_DB_URL")
        .expect("No se encontró ADMIN_DB_URL en el .env");
    let admin_pool = PgPool::connect(&admin_db_url).await?;

    {
        let mut state_pools = global_state.db_pools.lock().unwrap();
        state_pools.insert("admin".to_string(), admin_pool);
    }

    info!("Backend conectado con posgreSQL!");

    //App de axum con sus rutas y la capa de CORS para poder manejar las queries que lleguen del front
    let app = axum::Router::new()
        //Cada ruta tiene su handler definido en handlers.rs
        .route("/api/login", post(log_user))
        .route("/api/register", post(reg_user))
        .route("/api/exams", get(gather_exams))
        .route("/api/make-exam", post(make_exam).layer(DefaultBodyLimit::max(10240)))
        .route("/api/delete-exam", delete(delete_exam))
        .route("/api/connect-room", get(connect_room))
        .route("/api/query", post(query_db))
        .route("/api/open-room", post(open_room))
        .route("/api/close-room", post(close_room))
        .with_state(global_state)
        .layer(CorsLayer::new()
                .allow_headers(tower_http::cors::Any) //averigua como solo permitir ciertos headers
                .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
                .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::DELETE]));
    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap();

    info!("API funcionando...!");

    axum::serve(listener, app)
        .await
        .unwrap();

    Ok(())
}