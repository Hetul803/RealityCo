from __future__ import annotations

import base64
from datetime import datetime

from app.core.config import Settings

try:
    from google.cloud import storage
except Exception:  # pragma: no cover
    storage = None


class SnapshotStorageService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = storage.Client(project=settings.gcp_project_id) if settings.enable_gcs_snapshots and storage else None

    def upload_snapshot(self, session_id: str, image_base64: str) -> str | None:
        if not self.client or not self.settings.gcs_bucket:
            return None

        bucket = self.client.bucket(self.settings.gcs_bucket)
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
        blob = bucket.blob(f"sessions/{session_id}/{ts}.jpg")
        blob.upload_from_string(base64.b64decode(image_base64), content_type="image/jpeg")
        return f"gs://{self.settings.gcs_bucket}/{blob.name}"
