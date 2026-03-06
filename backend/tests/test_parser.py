from app.utils.parser import parse_gemini_structured_response


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
