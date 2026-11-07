from fastapi import APIRouter
from ..schemas.simulator import SimulationRequest, SimulationResponse
from ..services.simulator_service import simulator_service

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

@router.post("/simulate", response_model=SimulationResponse)
def simulate_resolution(payload: SimulationRequest):
    return simulator_service.simulate_resolution_options(
        service_name=payload.service_name,
        incident_description=payload.incident_description,
        candidate_options=payload.candidate_options
    )

