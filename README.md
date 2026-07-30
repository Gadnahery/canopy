# 🌳 Canopy Densitometer

Point the device up at a tree canopy, press **Capture**, and read the **canopy
cover %** on an LCD — while a modern web dashboard logs every measurement with
history and trends.

**Two boards, talking wirelessly through Supabase:**

- **ESP32 (NodeMCU-32S)** — owns the **capture button + LCD**. On a press it
  writes a "capture request" and shows the result. Nothing else.
- **ESP32-CAM** — a standalone wireless worker: watches for a request, takes the
  photo, uploads it, and calls the processing function. No wires to the ESP32.
- **Supabase** — storage, database, realtime, and the OpenCV-style segmentation
  (an Edge Function), so the device works with no browser open.

```
  ┌───────────────┐  1. button press → INSERT 'requested' row
  │  ESP32 board  │ ─────────────────────────────────────────────┐
  │  button + LCD │  5. poll row → LCD: Capturing→…→"Canopy 74.6%"│
  └───────────────┘ ◀───────────────────────────────┐            ▼
                                                     │      ┌───────────┐
  ┌───────────────┐  2. sees 'requested', shoots     │      │ Supabase  │
  │  ESP32-CAM    │     uploads JPEG, calls function ├─────▶│ DB+Storage│
  │  (standalone) │                                  │      │ +Realtime │
  └───────────────┘                                  │      └─────┬─────┘
                     3. Edge Function: Otsu sky/leaf │            │
                        → canopy % → row 'done' ◀────┘            │
  ┌───────────────┐  realtime history / trends / delete          │
  │ Web dashboard │ ◀────────────────────────────────────────────┘
  └───────────────┘
```

## Repository layout

```
densitometer/
├── firmware/
│   ├── esp32-main/esp32-main.ino    ESP32 controller: button + LCD + request/poll
│   └── esp32-cam/esp32-cam.ino      ESP32-CAM worker: watch → capture → upload → process
├── supabase/
│   ├── migrations/                  tables, storage bucket, realtime, RLS, delete policy
│   ├── functions/process-capture/   Edge Function: JPEG → canopy %
│   └── config.toml
├── samples/                         known-answer test images + capture simulator
└── web/                             Vite + React + TS + Tailwind dashboard
```

## Hardware

**ESP32 (NodeMCU-32S) — button + LCD**

| Part | Connection |
|------|------------|
| I²C LCD (16×2, 0x27) | SDA → **GPIO21**, SCL → **GPIO22**, VCC 5V, GND |
| Capture button | **GPIO25** → button → **GND** (internal pull-up, active-low) |
| Reset button | **EN** → GND (hardware reset) |

**ESP32-CAM — standalone worker**

| Part | Connection |
|------|------------|
| Camera | onboard ribbon |
| Power | 5V / 1A+ (weak supply → camera brown-out) |

The two boards share nothing but WiFi + the same Supabase project. Power each
independently. ⚠️ If your LCD backpack pulls I²C to 5V, power it at 3.3V or use a
level shifter — the ESP32 GPIOs are 3.3V.

## The image pipeline

`Canopy Cover (%) = leaf_pixels / total_pixels × 100`

Download JPEG → resize ≤640px → histogram the **blue** channel (sky bright,
canopy dark) → **Otsu** threshold → count → percentage. Tune it in
`supabase/functions/process-capture/index.ts`.

---

## Setup

### 1. Supabase
```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
supabase functions deploy process-capture --no-verify-jwt
```

### 2. Firmware (PlatformIO — one project per board)
Each board folder has its own `platformio.ini`. Copy `secrets.h.example` →
`secrets.h` in **both** folders and fill in the **same** WiFi + Supabase values.
```bash
# ESP32 controller (NodeMCU on USB)
cd firmware/esp32-main && pio run -t upload

# ESP32-CAM (on its USB programmer shield; hold IO0→GND on a bare module)
cd firmware/esp32-cam  && pio run -t upload
```
`secrets.h` is gitignored so your WiFi password / keys never reach GitHub.

Bench-testing without both boards: send `r` over the CAM's serial to inject a
fake request; or press the ESP32 button and the CAM will pick it up.

### 3. Web dashboard
```bash
cd web && cp .env.example .env.local   # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install && npm run dev
```
Deploy `web/` to Vercel/Netlify (set the two env vars). Live demo auto-deploys
from `main`.

---

## ⚠️ Hardening before real use

The prototype RLS lets the **anon key** read/insert/update/delete captures and
write Storage — fine for a bench demo, not the open internet. Before shipping:
give each device a signed token checked in the Edge Function (`verify_jwt = true`),
restrict the RLS/storage policies to it, and make the bucket private with signed URLs.
