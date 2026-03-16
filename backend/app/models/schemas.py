from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, List, Literal, Optional

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


class AnalysisMode(str, Enum):
    visual_guide = "visual_guide"
    interview_coach = "interview_coach"


class Annotation(BaseModel):
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(ge=0, le=1)
    height: float = Field(ge=0, le=1)
    label: str = Field(min_length=1, max_length=32)
    note: Optional[str] = Field(default=None, max_length=120)
    priority: int = Field(default=1, ge=1, le=5)


class VisionAnalysisResponse(BaseModel):
    mode: Literal["visual_guide"] = "visual_guide"
    spoken_text: str
    summary_text: str
    scene_description: str
    annotations: List[Annotation] = Field(default_factory=list)
    uncertainty: Optional[str] = None
    follow_up_suggestion: Optional[str] = None


class InterviewFillerWordCount(BaseModel):
    estimate: int = Field(ge=0, le=999)
    note: str


class InterviewStructureFeedback(BaseModel):
    has_clear_structure: bool
    note: str


class InterviewExampleFeedback(BaseModel):
    has_concrete_example: bool
    note: str


class InterviewOverallScore(BaseModel):
    value: int = Field(ge=0, le=10)
    scale: int = Field(default=10)
    rubric_note: str


class InterviewCoachResponse(BaseModel):
    mode: Literal["interview_coach"] = "interview_coach"
    spoken_feedback: str
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    filler_word_count: InterviewFillerWordCount
    pacing_hint: str
    structure_feedback: InterviewStructureFeedback
    example_feedback: InterviewExampleFeedback
    improved_answer: str
    overall_score: InterviewOverallScore
    confidence_note: str


class FrameAnalyzeRequest(BaseModel):
    session_id: str
    mode: AnalysisMode = AnalysisMode.visual_guide
    prompt: str = Field(min_length=1, max_length=800)
    image_base64: Optional[str] = None
    freeze_mode: bool = False
    recent_transcript: List[str] = Field(default_factory=list)
    selected_question: Optional[str] = Field(default=None, max_length=200)


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


class GeminiInterviewOutput(BaseModel):
    spoken_feedback: str
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    filler_word_count: dict[str, Any]
    pacing_hint: str
    structure_feedback: dict[str, Any]
    example_feedback: dict[str, Any]
    improved_answer: str
    overall_score: dict[str, Any]
    confidence_note: str
