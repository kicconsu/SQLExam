use axum::{
    http::{HeaderValue, Method},
    routing::get,
    Router,
    Json
};
use tracing::info;
use serde_json::Value;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main(){
    let app = Router::new()
        .route("/api/test", get(test))
        .layer(CorsLayer::new()
                .allow_origin("http://localhost:5173".parse::<HeaderValue>().unwrap())
                .allow_methods([Method::GET]));

    let addr = "0.0.0.0:3000";
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap();
    info!("Server serving...!");
    axum::serve(listener, app)
        .await
        .unwrap();
}

async fn test() -> Json<Value>{
    let result = serde_json::json!({
        "coño":"coñete"
    });
    Json(result)
}