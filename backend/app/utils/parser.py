import json
from typing import Any

from app.models.schemas import (
    Annotation,
    GeminiInterviewOutput,
    GeminiStructuredOutput,
    InterviewCoachResponse,
    InterviewExampleFeedback,
    InterviewFillerWordCount,
    InterviewOverallScore,
    InterviewStructureFeedback,
    VisionAnalysisResponse,
)


def extract_json_block(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in model response")
    return json.loads(text[start : end + 1])


def parse_gemini_structured_response(raw_text: str) -> VisionAnalysisResponse:
    payload = extract_json_block(raw_text)
    structured = GeminiStructuredOutput.model_validate(payload)

    annotations = []
    for item in structured.annotations:
        try:
            annotations.append(Annotation.model_validate(item))
        except Exception:
            continue

    return VisionAnalysisResponse(
        mode="visual_guide",
        spoken_text=structured.spoken_text,
        summary_text=structured.summary_text,
        scene_description=structured.scene_description,
        annotations=annotations,
        uncertainty=structured.uncertainty,
        follow_up_suggestion=structured.follow_up_suggestion,
    )


def parse_gemini_interview_response(raw_text: str) -> InterviewCoachResponse:
    payload = extract_json_block(raw_text)
    structured = GeminiInterviewOutput.model_validate(payload)

    return InterviewCoachResponse(
        mode="interview_coach",
        spoken_feedback=structured.spoken_feedback,
        summary=structured.summary,
        strengths=structured.strengths,
        weaknesses=structured.weaknesses,
        filler_word_count=InterviewFillerWordCount.model_validate(structured.filler_word_count),
        pacing_hint=structured.pacing_hint,
        structure_feedback=InterviewStructureFeedback.model_validate(structured.structure_feedback),
        example_feedback=InterviewExampleFeedback.model_validate(structured.example_feedback),
        improved_answer=structured.improved_answer,
        overall_score=InterviewOverallScore.model_validate(structured.overall_score),
        confidence_note=structured.confidence_note,
    )
