from __future__ import annotations

import base64
import json
import logging

from google.genai import Client
from google.genai import types as genai_types

from app.core.config import Settings
from app.models.schemas import AudioResponse, InterviewCoachResponse, SessionState, VisionAnalysisResponse
from app.prompts.system_prompts import (
    INTERVIEW_COACH_SYSTEM_PROMPT,
    REALITY_COPILOT_SYSTEM_PROMPT,
    build_interview_user_prompt,
    build_vision_user_prompt,
)
from app.utils.parser import parse_gemini_interview_response, parse_gemini_structured_response

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
                mode="visual_guide",
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
            logger.exception("Failed to parse Gemini visual response")
            return VisionAnalysisResponse(
                mode="visual_guide",
                spoken_text="I could not fully structure the visual response, but here is what I can say.",
                summary_text=raw_text[:500],
                scene_description="Partial analysis only.",
                uncertainty=f"Parsing error: {exc}",
                annotations=[],
                follow_up_suggestion="Try freeze-and-explain for a steadier frame.",
            )

    def analyze_interview(
        self,
        transcript_context: list[str],
        selected_question: str | None,
        user_prompt: str,
        freeze_mode: bool,
        image_base64: str | None = None,
    ) -> InterviewCoachResponse:
        joined = " ".join(transcript_context).strip()
        if len(joined) < 20:
            return InterviewCoachResponse(
                mode="interview_coach",
                spoken_feedback="I need a longer answer before I can coach it well.",
                summary="The transcript is too short for reliable coaching.",
                strengths=[],
                weaknesses=["Not enough response content yet."],
                filler_word_count={
                    "estimate": 0,
                    "note": "Transcript-based estimate only. Too little transcript to estimate reliably.",
                },
                pacing_hint="Answer for at least 20–30 seconds so I can assess pacing and structure.",
                structure_feedback={"has_clear_structure": False, "note": "Insufficient evidence in transcript."},
                example_feedback={"has_concrete_example": False, "note": "No concrete example detected yet."},
                improved_answer="Give a fuller answer first, then I can rewrite it strongly.",
                overall_score={"value": 2, "scale": 10, "rubric_note": "Communication-quality rubric only; not a hiring prediction."},
                confidence_note="Low confidence due to short/fragmented transcript evidence.",
            )

        if not self.client:
            return InterviewCoachResponse(
                mode="interview_coach",
                spoken_feedback="Gemini is not configured yet, so coaching is unavailable.",
                summary="No GEMINI_API_KEY configured on backend.",
                strengths=[],
                weaknesses=["Backend AI service not configured."],
                filler_word_count={"estimate": 0, "note": "Transcript-based estimate only; unavailable without Gemini."},
                pacing_hint="Set GEMINI_API_KEY and retry.",
                structure_feedback={"has_clear_structure": False, "note": "Unavailable."},
                example_feedback={"has_concrete_example": False, "note": "Unavailable."},
                improved_answer="Set Gemini credentials to generate an improved answer.",
                overall_score={"value": 0, "scale": 10, "rubric_note": "Communication-quality rubric only; not a hiring prediction."},
                confidence_note="No model output available.",
            )

        user_message = build_interview_user_prompt(
            transcript=transcript_context,
            selected_question=selected_question,
            user_prompt=user_prompt,
            freeze_mode=freeze_mode,
            has_image=bool(image_base64),
        )

        parts = [genai_types.Part(text=user_message)]
        if image_base64:
            parts.append(genai_types.Part(inline_data=genai_types.Blob(mime_type="image/jpeg", data=base64.b64decode(image_base64))))

        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=[genai_types.Content(role="user", parts=parts)],
            config=genai_types.GenerateContentConfig(
                system_instruction=INTERVIEW_COACH_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.25,
            ),
        )

        raw_text = response.text or "{}"
        logger.debug("Gemini interview raw response: %s", raw_text)
        try:
            return parse_gemini_interview_response(raw_text)
        except Exception as exc:
            logger.exception("Failed to parse Gemini interview response")
            return InterviewCoachResponse(
                mode="interview_coach",
                spoken_feedback="I can give a short coaching summary, but the structured output was incomplete.",
                summary=raw_text[:500],
                strengths=[],
                weaknesses=["Response parsing failed."],
                filler_word_count={"estimate": 0, "note": "Transcript-based estimate only; parse fallback used."},
                pacing_hint="Retry once with a steadier, complete answer.",
                structure_feedback={"has_clear_structure": False, "note": f"Parsing error: {exc}"},
                example_feedback={"has_concrete_example": False, "note": "Unknown due to parse fallback."},
                improved_answer="Please retry so I can generate a stronger rewritten version.",
                overall_score={"value": 5, "scale": 10, "rubric_note": "Communication-quality rubric only; not a hiring prediction."},
                confidence_note="Limited confidence because structured parsing failed.",
            )

    @staticmethod
    def to_json_preview(result: VisionAnalysisResponse) -> str:
        return json.dumps(result.model_dump(), indent=2)
