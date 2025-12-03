use axum::http::{HeaderMap, Response};
use reqwest::{Body};
use serde_json::Value;

pub fn token_from_heads(heads:HeaderMap) -> String {
    let acc_key;
    if heads.contains_key("Authorization") {
        acc_key = heads.get("Authorization").unwrap().to_str().unwrap();
    } else {
        acc_key = ""
    }
    acc_key.to_string()
}

pub async fn post_to(url:&str, body:Value, acc_key:String) -> reqwest::Response {
    let client = reqwest::Client::new();
    let response = client
        .post(url.to_string())
        .header("Authorization", format!("{}", acc_key))
        .json(&body)
        .send()
        .await
        .unwrap();
    response
}

pub async fn get_queried(url:&str, params:Vec<(String, String)>, acc_key:String) -> reqwest::Response {
    let client = reqwest::Client::new();
    let response = client
        .get(url.to_string())
        .header("Authorization", format!("{}", acc_key))
        .query(&params)
        .send()
        .await
        .unwrap();
    response
}

pub async fn delete_from(url:&str, body:Value, acc_key:String) -> reqwest::Response {
    let client = reqwest::Client::new();
    let response = client
        .delete(url.to_string())
        .header("Authorization", format!("{}", acc_key))
        .json(&body)
        .send()
        .await
        .unwrap();
    response
}

//Funcion auxiliar para construir una response de Axum a partir de una de reqwest. ni idea si hay mejor manera de hacer esto lol
//TODO: Quizas pasar los headers iterativamente? si es q hace falta pues
pub async fn build_ax_response(reqw_response:reqwest::Response) -> Response<Body> {
    Response::builder()
        .status(reqw_response.status())
        //.header(reqw_response.headers())
        .body(Body::from(reqw_response.text().await.unwrap()))
        .unwrap()
}