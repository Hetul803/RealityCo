from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Field, field_validator


class SessionState(str, Enum):
    idle = "idle"
    connecting = "connecting"
    listening = "listening"
    user_speaking = "user_speaking"
    analyzing = "analyzing_visual_context"
    thinking = "thinking"
    agent_speaking = "agent_speaking"
    error = "error"


class Annotation(BaseModel):
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(ge=0, le=1)
    height: float = Field(ge=0, le=1)
    label: str = Field(min_length=1, max_length=32)
    note: Optional[str] = Field(default=None, max_length=120)
    priority: int = Field(default=1, ge=1, le=5)


class VisionAnalysisResponse(BaseModel):
    spoken_text: str
    summary_text: str
    scene_description: str
    annotations: List[Annotation] = Field(default_factory=list)
    uncertainty: Optional[str] = None
    follow_up_suggestion: Optional[str] = None


class FrameAnalyzeRequest(BaseModel):
    session_id: str
    prompt: str = Field(min_length=1, max_length=800)
    image_base64: str = Field(min_length=20)
    freeze_mode: bool = False
    recent_transcript: List[str] = Field(default_factory=list)


class TranscriptTurn(BaseModel):
    role: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SessionCreateResponse(BaseModel):
    session_id: str
    state: SessionState


class SessionStateResponse(BaseModel):
    session_id: str
    state: SessionState


class AudioChunkRequest(BaseModel):
    session_id: str
    transcript_text: str = Field(min_length=1, max_length=1500)


class AudioResponse(BaseModel):
    spoken_text: str
    state: SessionState = SessionState.agent_speaking


class GenericError(BaseModel):
    detail: str


class GeminiStructuredOutput(BaseModel):
    spoken_text: str
    summary_text: str
    scene_description: str
    annotations: List[dict[str, Any]] = Field(default_factory=list)
    uncertainty: Optional[str] = None
    follow_up_suggestion: Optional[str] = None

    @field_validator("annotations", mode="before")
    @classmethod
    def ensure_list(cls, value: Any) -> list[dict[str, Any]]:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        return []
