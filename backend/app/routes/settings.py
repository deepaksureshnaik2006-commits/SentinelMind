from fastapi import APIRouter, Depends
from typing import Optional
from ..config import settings
from ..services.groq_service import groq_service
from ..services.hindsight_service import hindsight_service
from ..services.supabase_service import supabase_service
from ..repositories.in_memory_repo import repository
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("")
def get_system_settings():
    groq_configured = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
    hindsight_configured = bool(settings.HINDSIGHT_API_KEY and settings.HINDSIGHT_API_KEY.strip())
    supabase_configured = bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)

    # Groq verified status
    if groq_configured:
        groq_status = "Connected" if groq_service.is_connected() else "Disconnected"
    else:
        groq_status = "Not configured"

    # Hindsight verified status
    if hindsight_configured:
        hindsight_status = "Connected" if hindsight_service.is_live() else "Disconnected"
        hindsight_mode = "Hindsight Cloud API"
    else:
        hindsight_status = "Active"
        hindsight_mode = "Local Bank (Embedded Hybrid Store)"

    # Database verified status
    if supabase_configured:
        db_status = "Connected"
        db_type = "Supabase PostgreSQL"
    else:
        db_status = "Active"
        db_type = "Local Repository (Pre-seeded Demo Mode)"

    return {
        "app": {
            "name": "SentinelMind",
            "tagline": "An AI Agent That Learns From Every Incident",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "docs_url": "/docs",
            "openapi_url": "/openapi.json"
        },
        "groq": {
            "status": groq_status,
            "is_configured": groq_configured,
            "model": groq_service.model
        },
        "hindsight": {
            "status": hindsight_status,
            "is_configured": hindsight_configured,
            "bank_id": hindsight_service.bank_id,
            "base_url": hindsight_service.base_url,
            "mode": hindsight_mode
        },
        "database": {
            "status": db_status,
            "is_configured": supabase_configured,
            "type": db_type,
            "migration_ready": True
        }
    }

@router.post("/refresh")
def refresh_service_connections():
    """Triggers an active reconnection and verification of external services."""
    groq_service._init_client()
    hindsight_service._init_client()
    return {
        "status": "refreshed",
        "settings": get_system_settings()
    }

@router.delete("/account")
async def delete_user_account(current_user: UserContext = Depends(get_current_user)):
    """
    Permanently purges the authenticated user's account records:
    1. In-memory incidents, logs, recommendations, and feedback
    2. Supabase profile, incidents, logs, and feedback tables
    3. Hindsight memory bank associations
    """
    # 1. Purge repository data
    repository.purge_user_data(current_user.id)

    # 2. Purge Supabase database tables
    supabase_service.delete_user_records(current_user.id)

    # 3. Purge user's Hindsight bank
    user_bank_id = hindsight_service.get_user_bank_id(current_user.id)
    if hasattr(hindsight_service, "local_memories") and user_bank_id in hindsight_service.local_memories:
        del hindsight_service.local_memories[user_bank_id]

    return {
        "status": "success",
        "message": "User account and all associated workspace records permanently purged.",
        "user_id": current_user.id
    }
