"""Voxel Survivor - dark techno BGM generator.

Writes a 2-minute looping MIDI (128 BPM, A minor, 4/4) with kick/snare/hats,
offbeat synth bass + sub, dark chord stabs, sawtooth lead and a 16th arp.
Usage:  python tools/gen_bgm.py [out_path]
"""

import sys
from pathlib import Path

TPQ = 480
BEATS_PER_BAR = 4
BARS = 64
BAR = TPQ * BEATS_PER_BAR
END = BAR * BARS
BPM = 128
TEMPO_US = round(60_000_000 / BPM)  # 128 BPM

events = []
seq = 0


def add(tick, order, data):
    global seq
    events.append((tick, order, seq, data))
    seq += 1


def vlq(n):
    if n < 0:
        raise ValueError("negative delta")
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


def meta(tick, mtype, payload: bytes | str = b'', order=1):
    if isinstance(payload, str):
        payload = payload.encode('utf-8')
    add(tick, order, b'\xFF' + bytes([mtype]) + vlq(len(payload)) + payload)


def cc(tick, ch, controller, value):
    add(tick, 2, bytes([0xB0 | ch, controller, value]))


def program(tick, ch, prog):
    if ch == 9:
        return
    add(tick, 2, bytes([0xC0 | ch, prog]))


def note(tick, dur, ch, pitch, vel):
    if tick >= END:
        return
    dur = min(dur, END - tick)
    if dur <= 0:
        return
    pitch = max(0, min(127, pitch))
    vel = max(1, min(127, vel))
    add(tick, 3, bytes([0x90 | ch, pitch, vel]))
    add(tick + dur, 0, bytes([0x80 | ch, pitch, 0]))


def drum(tick, pitch, vel, dur=120):
    note(tick, dur, 9, pitch, vel)


# Loop markers + headers
for name in ("loopStart", "LoopStart"):
    meta(0, 0x06, name)
    meta(0, 0x01, name)

meta(0, 0x03, "Voxel Survivor - Dark Techno")
meta(0, 0x51, TEMPO_US.to_bytes(3, "big"))       # 128 BPM
meta(0, 0x58, bytes([0x04, 0x02, 0x18, 0x08]))   # 4/4
meta(0, 0x59, bytes([0x00, 0x01]))               # A minor

CH_BASS = 0
CH_CHORD = 1
CH_LEAD = 2
CH_ARP = 3
CH_PAD = 4
CH_DRUM = 9

# GM synths that sit well in the voxel/dark techno aesthetic
program(0, CH_BASS, 38)   # Synth Bass 1
program(0, CH_CHORD, 50)  # Synth Strings 1 (dark stabs)
program(0, CH_LEAD, 81)   # Lead 2 sawtooth
program(0, CH_ARP, 80)    # Lead 1 square
program(0, CH_PAD, 90)    # Pad 3 polysynth

for ch, vol in (
    (CH_BASS, 105),
    (CH_CHORD, 80),
    (CH_LEAD, 96),
    (CH_ARP, 66),
    (CH_PAD, 60),
    (CH_DRUM, 110),
):
    cc(0, ch, 7, vol)

for ch, pan in (
    (CH_BASS, 64),
    (CH_CHORD, 84),
    (CH_LEAD, 64),
    (CH_ARP, 42),
    (CH_PAD, 64),
    (CH_DRUM, 64),
):
    cc(0, ch, 10, pan)


# Dark A-minor loop: i - VI - V - i (Am F E Am). The E-major V keeps it tense.
PROG = [
    {
        "root": 45,                 # A2
        "chord": (57, 60, 64),      # A3 C4 E4
        "lead": (69, 72, 76, 74, 72, 69, 67, 69),
    },
    {
        "root": 41,                 # F2
        "chord": (53, 57, 60),      # F3 A3 C4
        "lead": (65, 69, 72, 69, 67, 65, 64, 65),
    },
    {
        "root": 40,                 # E2 (harmonic-minor V)
        "chord": (52, 56, 59),      # E3 G#3 B3
        "lead": (66, 71, 75, 71, 68, 71, 66, 68),
    },
    {
        "root": 45,                 # A2
        "chord": (57, 60, 64),      # A3 C4 E4
        "lead": (69, 72, 76, 79, 76, 72, 69, 72),
    },
]


def section_name(bar):
    if bar < 4:
        return "intro_min"
    if bar < 8:
        return "intro"
    if bar < 16:
        return "build"
    if bar < 32:
        return "drop"
    if bar < 40:
        return "break"
    if bar < 56:
        return "drop2"
    return "outro"


def add_drums(bar, sec):
    t = bar * BAR

    # 4-on-the-floor kick drives the whole track
    kick_vel = 108 if sec in ("drop", "drop2", "outro") else 100
    for beat in range(4):
        drum(t + beat * TPQ, 36, kick_vel, 130)

    # Backbeat snare once the groove locks in
    if sec in ("build", "drop", "break", "drop2", "outro") and bar not in (15, 39, 63):
        for beat in (1, 3):
            drum(t + beat * TPQ, 39, 96, 130)

    # Hats (closed 8ths, open on offbeats once it heats up)
    open_hats = sec in ("build", "drop", "drop2", "outro")
    base = 64 if sec == "intro_min" else 84
    for i in range(8):
        tick = t + i * 240
        if i % 2 == 0:
            drum(tick, 42, base if open_hats else 66, 70)
        else:
            if open_hats:
                drum(tick, 46, base, 130)
            else:
                drum(tick, 42, 56 if sec != "intro_min" else 48, 70)

    # Snare rolls to push into the drops
    if bar in (14, 38):
        for i in range(8):
            drum(t + i * 240, 38, 62 + i * 7, 130)
    if bar in (15, 39, 63):
        for i in range(16):
            drum(t + i * 120, 38, 56 + i * 5, 90)

    # Low toms diving into the drop
    if bar in (15, 39):
        for i in range(4):
            drum(t + 2880 + i * 160, 43, 74 - i * 7, 130)


def add_bass(bar, root, sec):
    if bar < 4:
        return
    t = bar * BAR
    base_vel = 104 if sec in ("drop", "drop2", "outro") else 96
    if sec == "break":
        base_vel = 86

    # Offbeat techno bass + sub octave in the full sections
    for i, off in enumerate((240, 720, 1200, 1680)):
        vel = base_vel if i % 2 == 0 else base_vel - 8
        note(t + off, 170, CH_BASS, root, vel)
        if sec in ("drop", "drop2", "outro"):
            note(t + off, 170, CH_BASS, root - 12, max(40, vel - 24))

    # Pickup into the next 4-bar cycle
    if bar in (15, 39, 63):
        note(t + 1800, 90, CH_BASS, root + 12, 92)


def add_chords(bar, chord, sec):
    if sec not in ("build", "drop", "drop2", "outro"):
        return
    t = bar * BAR

    # Quarter-note dark stabs
    for beat in range(4):
        vel = 84 if beat == 0 else 72
        for p in chord:
            note(t + beat * TPQ, 150, CH_CHORD, p, vel)

    # Extra push before each cycle repeats
    if sec in ("drop", "drop2", "outro") and bar % 4 == 3:
        for p in chord:
            note(t + 1680, 130, CH_CHORD, p, 62)


def add_pad(bar, chord, sec):
    if not (4 <= bar < 16 or sec == "break"):
        return
    t = bar * BAR
    vel = 48 if sec == "break" else 40
    octave = 12 if sec == "break" else 0
    for p in chord:
        note(t, BAR - 120, CH_PAD, p + octave, vel)


def add_arp(bar, chord, sec):
    if not (8 <= bar < 16 or 40 <= bar < 56):
        return
    t = bar * BAR
    pattern = (chord[0], chord[1], chord[2], chord[1])

    for i in range(16):
        p = pattern[i % 4] + 12
        vel = 54 if i % 4 == 0 else 46
        note(t + i * 120, 90, CH_ARP, p, vel)


def add_lead(bar, pattern, sec):
    if sec not in ("drop", "drop2", "outro"):
        return
    t = bar * BAR
    octave = 0

    # drop2 alternates octaves for variation
    if sec == "drop2":
        if ((bar - 40) // 4) % 2 == 1:
            octave = 12

    # Final lift in the outro
    if sec == "outro" and bar >= 60:
        octave = 12

    for i, p in enumerate(pattern):
        tick = t + i * 240
        pitch = p + octave
        vel = 94 if i % 4 == 0 else 86

        # Last note of each cycle lands on the next downbeat
        dur = 240 if (bar % 4 == 3 and i == 7) else 210
        note(tick, dur, CH_LEAD, pitch, vel)


SECTION_STARTS = {0, 8, 16, 32, 40, 56}

for bar in range(BARS):
    sec = section_name(bar)
    info = PROG[bar % 4]
    t = bar * BAR

    if bar in SECTION_STARTS:
        drum(t, 49, 100, 960)  # crash

    add_drums(bar, sec)
    add_bass(bar, info["root"], sec)
    add_chords(bar, info["chord"], sec)
    add_pad(bar, info["chord"], sec)
    add_arp(bar, info["chord"], sec)
    add_lead(bar, info["lead"], sec)

# End loop point
for name in ("loopEnd", "LoopEnd"):
    meta(END, 0x06, name)
    meta(END, 0x01, name)

events.sort(key=lambda e: (e[0], e[1], e[2]))

track = bytearray()
last_tick = 0
for tick, _, _, data in events:
    track += vlq(tick - last_tick) + data
    last_tick = tick
track += vlq(0) + b'\xFF\x2F\x00'

midi = bytearray()
midi += b'MThd'
midi += (6).to_bytes(4, 'big')
midi += (0).to_bytes(2, 'big')   # format 0
midi += (1).to_bytes(2, 'big')   # one track
midi += TPQ.to_bytes(2, 'big')

midi += b'MTrk'
midi += len(track).to_bytes(4, 'big')
midi += track

out = Path(sys.argv[1] if len(sys.argv) > 1 else "assets/bgm/voxel_survivor_techno.mid")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(bytes(midi))

duration_sec = (END / TPQ) * (TEMPO_US / 1_000_000)
print(f"Created {out.resolve()}")
print(f"Duration: {duration_sec:.1f} seconds")
