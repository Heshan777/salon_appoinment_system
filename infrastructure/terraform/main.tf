terraform {
  required_version = ">= 1.5.0"
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.3.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.15.0"
    }
  }
}

# -------------------------------------------------------------
# MongoDB Atlas Cluster Configuration
# -------------------------------------------------------------
provider "mongodbatlas" {
  public_key  = var.mongodbatlas_public_key
  private_key = var.mongodbatlas_private_key
}

resource "mongodbatlas_cluster" "salon_cluster" {
  count                       = var.atlas_project_id != "" ? 1 : 0
  project_id                  = var.atlas_project_id
  name                        = "salon-management-${var.environment}"
  cluster_type                = "REPLICASET"
  provider_name               = "TENANT"
  backing_provider_name       = "AWS"
  provider_region_name        = "US_EAST_1"
  provider_instance_size_name = "M0" # Free tier for academic/dev deployments
}

# -------------------------------------------------------------
# Render Blueprint Deployment Provisioning
# -------------------------------------------------------------
provider "render" {
  api_key = var.render_api_key
}

# Output note for Render Blueprint deployment
resource "null_resource" "deployment_notice" {
  provisioner "local-exec" {
    command = "echo Terraform orchestration initialized for Salon Management System"
  }
}
