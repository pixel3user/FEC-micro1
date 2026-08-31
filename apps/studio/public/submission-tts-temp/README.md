# SubmissionVideo narration

`submission-narration.mp3` is the single continuous narration track for `SubmissionVideo`. It replaces 47 independently mounted clips, preventing decoder-boundary clipping and removing fixed caption-slot silence.

Voice: Microsoft Edge `en-US-AvaMultilingualNeural` at one consistent `+25%` rate. Sentence punctuation supplies the natural pauses.

Regenerate the audio, source timing, timing report, and `public/submission-video.srt` together:

```bash
python3 -m pip install -r apps/studio/scripts/requirements-submission-narration.txt
python3 apps/studio/scripts/generate-submission-narration.py
```

The canonical narration text is `src/remotion/submission/narration-script.json`; generated frame timing is `src/remotion/submission/narration-timing.json`.
