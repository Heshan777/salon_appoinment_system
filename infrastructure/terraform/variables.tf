variable "environment" {
  description = "Deployment environment (development, staging, production)"
  type        = string
  default     = "production"
}

variable "render_api_key" {
  description = "Render API key for deployment automation"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mongodbatlas_public_key" {
  description = "MongoDB Atlas programmatic public API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "mongodbatlas_private_key" {
  description = "MongoDB Atlas programmatic private API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "atlas_project_id" {
  description = "MongoDB Atlas Project / Organization ID"
  type        = string
  default     = ""
}

variable "supabase_project_ref" {
  description = "Supabase Project reference identifier"
  type        = string
  default     = ""
}
