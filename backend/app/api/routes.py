from fastapi import APIRouter, Depends, HTTPException

from app.core.config import Settings, get_settings
from app.models.schemas import (
    AudioChunkRequest,
    AudioResponse,
    FrameAnalyzeRequest,
    SessionCreateResponse,
    SessionState,
    SessionStateResponse,
    VisionAnalysisResponse,
)
from app.services.gemini_service import GeminiService
from app.services.session_manager import SessionManager
from app.services.storage_service import SnapshotStorageService

router = APIRouter()
session_manager = SessionManager()


def get_gemini_service(settings: Settings = Depends(get_settings)) -> GeminiService:
    return GeminiService(settings)


def get_storage_service(settings: Settings = Depends(get_settings)) -> SnapshotStorageService:
    return SnapshotStorageService(settings)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/sessions", response_model=SessionCreateResponse)
async def create_session() -> SessionCreateResponse:
    session = session_manager.create_session()
    session_manager.update_state(session.session_id, SessionState.listening)
    return SessionCreateResponse(session_id=session.session_id, state=SessionState.listening)


@router.get("/sessions/{session_id}", response_model=SessionStateResponse)
async def get_session_state(session_id: str) -> SessionStateResponse:
    try:
        session = session_manager.get_session(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return SessionStateResponse(session_id=session_id, state=session.state)


@router.post("/audio/transcript", response_model=AudioResponse)
async def process_transcript(
    req: AudioChunkRequest,
    gemini: GeminiService = Depends(get_gemini_service),
) -> AudioResponse:
    try:
        session_manager.update_state(req.session_id, SessionState.user_speaking)
        session_manager.add_turn(req.session_id, "user", req.transcript_text)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    session_manager.update_state(req.session_id, SessionState.thinking)
    response = gemini.chat_from_transcript(req.transcript_text)
    session_manager.add_turn(req.session_id, "assistant", response.spoken_text)
    session_manager.update_state(req.session_id, SessionState.listening)
    return response


@router.post("/vision/analyze", response_model=VisionAnalysisResponse)
async def analyze_frame(
    req: FrameAnalyzeRequest,
    gemini: GeminiService = Depends(get_gemini_service),
    storage: SnapshotStorageService = Depends(get_storage_service),
) -> VisionAnalysisResponse:
    try:
        session_manager.update_state(req.session_id, SessionState.analyzing)
        transcript = session_manager.recent_transcript_text(req.session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    transcript_context = req.recent_transcript or transcript
    _ = storage.upload_snapshot(req.session_id, req.image_base64)
    response = gemini.analyze_frame(
        image_base64=req.image_base64,
        user_prompt=req.prompt,
        freeze_mode=req.freeze_mode,
        transcript_context=transcript_context,
    )
    session_manager.add_turn(req.session_id, "assistant", response.spoken_text)
    session_manager.update_state(req.session_id, SessionState.listening)
    return response
