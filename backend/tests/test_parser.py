from app.utils.parser import parse_gemini_interview_response, parse_gemini_structured_response


def test_parse_structured_response_success() -> None:
    raw = """
    {
      "spoken_text": "I see a laptop and a notebook.",
      "summary_text": "Two main objects are centered.",
      "scene_description": "Desk with laptop and notebook",
      "annotations": [
        {"x": 0.1, "y": 0.2, "width": 0.3, "height": 0.2, "label": "Laptop", "note": "Main focus", "priority": 1}
      ],
      "uncertainty": null,
      "follow_up_suggestion": "Tilt camera down a bit for keyboard details."
    }
    """
    parsed = parse_gemini_structured_response(raw)
    assert parsed.spoken_text.startswith("I see")
    assert len(parsed.annotations) == 1
    assert parsed.annotations[0].label == "Laptop"


def test_parse_structured_response_drops_invalid_annotations() -> None:
    raw = """
    {
      "spoken_text": "Test",
      "summary_text": "Test",
      "scene_description": "Test",
      "annotations": [
        {"x": -1, "y": 2, "width": 3, "height": 4, "label": "Bad", "priority": 10},
        {"x": 0.2, "y": 0.2, "width": 0.4, "height": 0.3, "label": "Good", "priority": 2}
      ]
    }
    """
    parsed = parse_gemini_structured_response(raw)
    assert len(parsed.annotations) == 1
    assert parsed.annotations[0].label == "Good"


def test_parse_interview_response_success() -> None:
    raw = """
    {
      "spoken_feedback": "Your answer is clear, but add a concrete metric.",
      "summary": "Good structure with room for stronger evidence.",
      "strengths": ["Clear opening", "Concise language"],
      "weaknesses": ["No quantified impact"],
      "filler_word_count": {"estimate": 3, "note": "Transcript-based estimate only; spoken disfluencies may be missed."},
      "pacing_hint": "Pause briefly between context and action.",
      "structure_feedback": {"has_clear_structure": true, "note": "You used a basic STAR-like sequence."},
      "example_feedback": {"has_concrete_example": true, "note": "You gave one project example but not outcomes."},
      "improved_answer": "In my last role, I resolved...",
      "overall_score": {"value": 7, "scale": 10, "rubric_note": "Communication-quality rubric only; not a hiring prediction."},
      "confidence_note": "Moderate confidence from transcript evidence."
    }
    """
    parsed = parse_gemini_interview_response(raw)
    assert parsed.mode == "interview_coach"
    assert parsed.overall_score.value == 7
    assert parsed.example_feedback.has_concrete_example is True
