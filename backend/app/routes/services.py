from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from ..repositories.in_memory_repo import repository
from ..dependencies.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/services", tags=["infrastructure-services"])

class ServiceCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Service identifier or microservice name")
    tier: Optional[str] = Field("tier-1", description="Criticality tier (tier-1, tier-2, tier-3)")
    environment: Optional[str] = Field("production", description="Environment (production, staging, etc.)")
    description: Optional[str] = Field(None, description="Optional service description or responsibility")

@router.get("", response_model=List[Dict[str, Any]])
def list_user_services(current_user: UserContext = Depends(get_current_user)):
    """
    List infrastructure services strictly belonging to the authenticated user.
    Dynamic health is computed from real-time active incidents.
    """
    return repository.list_services(user_id=current_user.id)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_user_service(
    payload: ServiceCreateRequest,
    current_user: UserContext = Depends(get_current_user)
):
    """
    Configure a new microservice in the authenticated user's workspace.
    """
    try:
        new_svc = repository.create_service(payload.dict(), user_id=current_user.id)
        return new_svc
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create service: {str(e)}")

@router.delete("/{service_id}", status_code=status.HTTP_200_OK)
def delete_user_service(
    service_id: str,
    current_user: UserContext = Depends(get_current_user)
):
    """
    Remove an infrastructure service from the user's workspace.
    """
    success = repository.delete_service(service_id=service_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Service not found or unauthorized")
    return {"status": "success", "message": f"Service {service_id} removed"}
