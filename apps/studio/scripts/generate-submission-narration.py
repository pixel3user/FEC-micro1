#!/usr/bin/env python3
"""Generate the SubmissionVideo's continuous narration, cue timing, and SRT."""

from __future__ import annotations

import asyncio
import json
import math
import re
from io import BytesIO
from itertools import groupby
from pathlib import Path
from typing import Any

import edge_tts
from mutagen.mp3 import MP3

FPS = 30
VOICE = "en-US-AvaMultilingualNeural"
RATE = "+25%"
ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "src/remotion/submission/narration-script.json"
TIMING_PATH = ROOT / "src/remotion/submission/narration-timing.json"
PUBLIC_PATH = ROOT / "public"
AUDIO_PATH = PUBLIC_PATH / "submission-tts-temp/submission-narration.mp3"
REPORT_PATH = PUBLIC_PATH / "submission-tts-temp/timing-report.json"
SRT_PATH = PUBLIC_PATH / "submission-video.srt"
TOKEN_PATTERN = re.compile(r"[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*")


def tokens(text: str) -> list[str]:
    return [token.replace("’", "'").casefold() for token in TOKEN_PATTERN.findall(text)]


def srt_timestamp(seconds: float) -> str:
    milliseconds = max(0, round(seconds * 1000))
    hours, milliseconds = divmod(milliseconds, 3_600_000)
    minutes, milliseconds = divmod(milliseconds, 60_000)
    whole_seconds, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{whole_seconds:02},{milliseconds:03}"


async def synthesize_chunk(
    chapter: str, cues: list[dict[str, str]], semaphore: asyncio.Semaphore
) -> tuple[str, bytes, list[dict[str, Any]], float]:
    text = "\n\n".join(cue["text"] for cue in cues)
    audio = bytearray()
    boundaries: list[dict[str, Any]] = []

    async with semaphore:
        for attempt in range(4):
            try:
                communicator = edge_tts.Communicate(text, VOICE, rate=RATE)
                async for event in communicator.stream():
                    if event["type"] == "audio":
                        audio.extend(event["data"])
                    elif event["type"] in {"SentenceBoundary", "WordBoundary"}:
                        boundaries.append(event)
                if audio:
                    break
            except edge_tts.exceptions.NoAudioReceived:
                if attempt == 3:
                    raise
                audio.clear()
                boundaries.clear()
                await asyncio.sleep(1.5 * (attempt + 1))

    data = bytes(audio)
    duration = float(MP3(BytesIO(data)).info.length)
    return chapter, data, boundaries, duration


async def synthesize(
    script: list[dict[str, str]],
) -> tuple[list[dict[str, Any]], float]:
    # Each chapter is one TTS request so the service can stream reliably. The
    # resulting MP3 streams are joined into one browser-decoded asset; caption
    # sentences remain separated only by the voice's natural punctuation pause.
    groups = [
        (chapter, list(cues))
        for chapter, cues in groupby(script, key=lambda cue: cue["chapter"])
    ]
    semaphore = asyncio.Semaphore(1)
    chunks = await asyncio.gather(
        *(synthesize_chunk(chapter, cues, semaphore) for chapter, cues in groups)
    )

    adjusted_boundaries: list[dict[str, Any]] = []
    elapsed_seconds = 0.0
    AUDIO_PATH.parent.mkdir(parents=True, exist_ok=True)
    with AUDIO_PATH.open("wb") as audio_file:
        for _, audio, boundaries, duration in chunks:
            audio_file.write(audio)
            offset_ticks = round(elapsed_seconds * 10_000_000)
            adjusted_boundaries.extend(
                [{**boundary, "offset": boundary["offset"] + offset_ticks} for boundary in boundaries]
            )
            elapsed_seconds += duration

    return adjusted_boundaries, elapsed_seconds


def derive_timing(
    script: list[dict[str, str]], boundaries: list[dict[str, Any]], audio_seconds: float
) -> list[dict[str, Any]]:
    expected: list[str] = []
    cue_token_ranges: list[tuple[int, int]] = []
    for cue in script:
        start = len(expected)
        expected.extend(tokens(cue["text"]))
        cue_token_ranges.append((start, len(expected)))

    observed: list[str] = []
    observed_events: list[dict[str, Any]] = []
    for boundary in boundaries:
        boundary_tokens = tokens(str(boundary["text"]))
        observed.extend(boundary_tokens)
        observed_events.extend([boundary] * len(boundary_tokens))

    if observed != expected:
        mismatch = next(
            (index for index, pair in enumerate(zip(expected, observed)) if pair[0] != pair[1]),
            min(len(expected), len(observed)),
        )
        raise RuntimeError(
            "TTS word boundaries no longer match narration-script.json at token "
            f"{mismatch}: expected={expected[mismatch:mismatch + 8]!r}, "
            f"observed={observed[mismatch:mismatch + 8]!r}"
        )

    timing: list[dict[str, Any]] = []
    for index, (cue, (start_token, end_token)) in enumerate(zip(script, cue_token_ranges)):
        first_event = observed_events[start_token]
        last_event = observed_events[end_token - 1]
        speech_start = float(first_event["offset"]) / 10_000_000
        speech_end = (
            float(last_event["offset"]) + float(last_event["duration"])
        ) / 10_000_000
        from_frame = 0 if index == 0 else round(speech_start * FPS)
        timing.append(
            {
                "id": cue["id"],
                "chapter": cue["chapter"],
                "from": from_frame,
                "speechStartSeconds": round(speech_start, 3),
                "speechEndSeconds": round(speech_end, 3),
            }
        )

    for index, cue in enumerate(timing):
        if index + 1 < len(timing):
            cue["to"] = timing[index + 1]["from"]
        else:
            cue["to"] = math.ceil(max(audio_seconds, cue["speechEndSeconds"] + 0.35) * FPS)

    return timing


def write_outputs(
    script: list[dict[str, str]], timing: list[dict[str, Any]], audio_seconds: float
) -> None:
    TIMING_PATH.write_text(json.dumps(timing, indent=2) + "\n", encoding="utf-8")

    report = {
        "voice": VOICE,
        "rate": RATE,
        "fps": FPS,
        "audioFile": "submission-tts-temp/submission-narration.mp3",
        "audioDurationSeconds": round(audio_seconds, 3),
        "cueCount": len(timing),
        "cues": [
            {
                **cue,
                "captionDurationSeconds": round((cue["to"] - cue["from"]) / FPS, 3),
            }
            for cue in timing
        ],
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    blocks: list[str] = []
    for index, (cue, times) in enumerate(zip(script, timing), start=1):
        blocks.append(
            "\n".join(
                [
                    str(index),
                    f"{srt_timestamp(times['from'] / FPS)} --> {srt_timestamp(times['to'] / FPS)}",
                    cue["text"],
                ]
            )
        )
    SRT_PATH.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")


async def main() -> None:
    script = json.loads(SCRIPT_PATH.read_text(encoding="utf-8"))
    boundaries, audio_seconds = await synthesize(script)
    timing = derive_timing(script, boundaries, audio_seconds)
    write_outputs(script, timing, audio_seconds)
    print(
        f"Generated {len(timing)} cues with {VOICE} at {RATE}; "
        f"continuous audio is {audio_seconds:.3f}s."
    )


if __name__ == "__main__":
    asyncio.run(main())
