from __future__ import annotations

import base64
import json
import logging

from google.genai import Client
from google.genai import types as genai_types

from app.core.config import Settings
from app.models.schemas import AudioResponse, SessionState, VisionAnalysisResponse
from app.prompts.system_prompts import REALITY_COPILOT_SYSTEM_PROMPT, build_vision_user_prompt
from app.utils.parser import parse_gemini_structured_response

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

    def chat_from_transcript(self, transcript_text: str) -> AudioResponse:
        if not self.client:
            return AudioResponse(
                spoken_text="I can hear you locally, but Gemini is not configured yet. Add GEMINI_API_KEY to enable live answers.",
                state=SessionState.error,
            )

        prompt = (
            "You are Reality Copilot. Give a concise spoken response. "
            "If vision context is missing, ask for a frame analysis.\n"
            f"User said: {transcript_text}"
        )
        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(temperature=0.4),
        )
        text = response.text or "I need a clearer prompt to help."
        return AudioResponse(spoken_text=text, state=SessionState.agent_speaking)

    def analyze_frame(
        self,
        image_base64: str,
        user_prompt: str,
        freeze_mode: bool,
        transcript_context: list[str],
    ) -> VisionAnalysisResponse:
        if not self.client:
            return VisionAnalysisResponse(
                spoken_text="I need Gemini credentials to analyze this frame.",
                summary_text="No GEMINI_API_KEY configured on backend.",
                scene_description="Analysis unavailable.",
                annotations=[],
                uncertainty="Backend AI service not configured.",
                follow_up_suggestion="Set GEMINI_API_KEY and retry.",
            )

        user_message = build_vision_user_prompt(user_prompt, freeze_mode, transcript_context)
        image_bytes = base64.b64decode(image_base64)

        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=[
                genai_types.Content(
                    role="user",
                    parts=[
                        genai_types.Part(text=user_message),
                        genai_types.Part(
                            inline_data=genai_types.Blob(mime_type="image/jpeg", data=image_bytes)
                        ),
                    ],
                )
            ],
            config=genai_types.GenerateContentConfig(
                system_instruction=REALITY_COPILOT_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        raw_text = response.text or "{}"
        logger.debug("Gemini raw response: %s", raw_text)
        try:
            return parse_gemini_structured_response(raw_text)
        except Exception as exc:
            logger.exception("Failed to parse Gemini response")
            return VisionAnalysisResponse(
                spoken_text="I could not fully structure the visual response, but here is what I can say.",
                summary_text=raw_text[:500],
                scene_description="Partial analysis only.",
                uncertainty=f"Parsing error: {exc}",
                annotations=[],
                follow_up_suggestion="Try freeze-and-explain for a steadier frame.",
            )

    @staticmethod
    def to_json_preview(result: VisionAnalysisResponse) -> str:
        return json.dumps(result.model_dump(), indent=2)
