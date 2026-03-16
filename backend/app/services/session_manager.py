from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List
from uuid import uuid4

from app.models.schemas import SessionState, TranscriptTurn


@dataclass
class LiveSession:
    session_id: str
    state: SessionState = SessionState.idle
    transcript: List[TranscriptTurn] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


class SessionManager:
    def __init__(self) -> None:
        self._sessions: Dict[str, LiveSession] = {}

    def create_session(self) -> LiveSession:
        session = LiveSession(session_id=str(uuid4()), state=SessionState.connecting)
        self._sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> LiveSession:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError(f"Unknown session: {session_id}")
        return session

    def update_state(self, session_id: str, state: SessionState) -> LiveSession:
        session = self.get_session(session_id)
        session.state = state
        return session

    def add_turn(self, session_id: str, role: str, text: str) -> TranscriptTurn:
        session = self.get_session(session_id)
        turn = TranscriptTurn(role=role, text=text)
        session.transcript.append(turn)
        return turn

    def recent_transcript_text(self, session_id: str, max_turns: int = 8) -> list[str]:
        session = self.get_session(session_id)
        return [f"{t.role}: {t.text}" for t in session.transcript[-max_turns:]]
