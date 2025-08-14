terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = { source  = "hashicorp/google", version = "~> 5.30.0" }
  }
}
provider "google" { project = var.project_id region = var.region }
resource "google_artifact_registry_repository" "repo" {
  location = var.region
  repository_id = "sparkapp84"
  format = "DOCKER"
}
resource "google_service_account" "spark_api_sa" {
  account_id   = "spark-api-sa"
  display_name = "Spark API Service Account"
}

resource "google_cloud_run_v2_service_iam_binding" "api_invoker" {
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  members = [
    "serviceAccount:${google_service_account.spark_api_sa.email}"
  ]
}

resource "google_cloud_run_v2_service" "api" {
  name     = "spark-api"
  location = var.region
  template {
    service_account = google_service_account.spark_api_sa.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/sparkapp84/spark-api:latest"
    }
  }
  ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"
}
resource "google_redis_instance" "redis" {
  name = "spark-redis"
  memory_size_gb = 1
  region = var.region
  tier = "BASIC"
}
variable "project_id" {}
variable "region" { default = "us-central1" }

resource "google_cloud_run_domain_mapping" "default" {
  location = google_cloud_run_v2_service.api.location
  name     = "www.sparkcreativesinc.org"

  spec {
    route_name = google_cloud_run_v2_service.api.name
    certificate_mode = "AUTOMATIC"
  }
}
