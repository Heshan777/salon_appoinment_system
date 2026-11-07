output "environment" {
  description = "The target deployment environment"
  value       = var.environment
}

output "atlas_cluster_name" {
  description = "Name of the provisioned MongoDB Atlas cluster"
  value       = var.atlas_project_id != "" ? mongodbatlas_cluster.salon_cluster[0].name : "Not provisioned (atlas_project_id unset)"
}
