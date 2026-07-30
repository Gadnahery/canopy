# 🌳 Canopy Densitometer

Point an **ESP32-CAM** up at a tree canopy, press **Capture**, and get the
**canopy cover %** on a small LCD — while a modern web dashboard logs every
measurement with history and trends.

All the heavy lifting (image segmentation) happens **server-side in a Supabase
Edge Function**, so the device works even with no browser open.

```
┌──────────────┐   1. capture + upload JPEG      ┌────────────────────┐
│  ESP32-CAM   │ ───────────────────────────────▶│  Supabase Storage  │
│  + I2C LCD   │                                  └─────────┬──────────┘
│  + 1 button  │   2. call process-capture                  │ download
│  (+ EN reset)│ ───────────────────────────────▶┌─────────▼──────────┐
└──────▲───────┘   4. canopy % in the response    │  Edge Function     │
       │                                          │  (Otsu sky/leaf)   │
       │ shows: Capturing→Uploading→              └─────────┬──────────┘
       │        Processing→Canopy: 74.6%           3. write │ captures row
                                                  ┌─────────▼──────────┐
   ┌──────────────┐   realtime history/trends     │  Postgres (RLS)    │
   │  Web dashboard│ ◀────────────────────────────│  + Realtime        │
   └──────────────┘                               └────────────────────┘
```

## Repository layout

```
densitometer/
├── firmware/
│   └── esp32-cam/esp32-cam.ino     All-in-one: camera + LCD + button + upload
├── supabase/
│   ├── migrations/0001_init.sql    Tables, storage bucket, realtime, RLS
│   ├── functions/process-capture/  Edge Function: JPEG → canopy %
│   └── config.toml
└── web/                            Vite + React + TS + Tailwind dashboard
```

## Hardware (what you actually have)

| Part | Connection on the ESP32-CAM |
|------|------------------------------|
| I2C LCD (16×2, addr 0x27) | SDA → **GPIO15**, SCL → **GPIO14**, VCC 5V, GND |
| Capture button | **GPIO13** → GND (internal pull-up, active-low) |
| Reset/Enable button | **EN** pin → GND (hardware reset) |
| Power | 5V / 1A+ (weak supplies cause camera brown-outs) |

> The original PCB (NodeMCU + fingerprint + QR + SPI) is **not used** — this
> build runs entirely on the ESP32-CAM. Change the pins at the top of the `.ino`
> if you wire the LCD/button differently.

## The image pipeline

`Canopy Cover (%) = leaf_pixels / total_pixels × 100`

1. Download the JPEG from Storage
2. Resize to ≤640 px wide (the ratio is scale-invariant, this just speeds it up)
3. Build a histogram of the **blue channel** (sky is bright-blue, canopy is dark)
4. **Otsu's method** picks the sky/leaf threshold automatically
5. Pixels at/below the threshold = canopy → compute the percentage

Swap in HSV / a fixed threshold inside `functions/process-capture/index.ts` if
your lighting needs it — everything downstream stays the same.

---

## Setup

### 1. Supabase
```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# schema + storage bucket + realtime + RLS
supabase db push          # (or paste supabase/migrations/0001_init.sql in the SQL editor)

# deploy the processor
supabase functions deploy process-capture --no-verify-jwt
```
Grab your **Project URL** and **anon key** from *Project Settings → API*.

### 2. Firmware
Open `firmware/esp32-cam/esp32-cam.ino` in Arduino IDE.
- Board **AI Thinker ESP32-CAM**, PSRAM **Enabled**, Partition **Huge APP**
- Install libraries: **LiquidCrystal I2C** (Frank de Brabander), **ArduinoJson**
- Fill in `WIFI_SSID`, `WIFI_PASS`, `SUPABASE_HOST`, `SUPABASE_ANON`, `DEVICE_ID`
- Flash (hold IO0→GND to enter bootloader on bare modules), then reset

### 3. Web dashboard
```bash
cd web
cp .env.example .env.local     # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev                    # http://localhost:5173
```
Deploy the `web/` folder to Vercel/Netlify/Cloudflare Pages (set the two env vars).

Optional — register the device so history reads nicely:
```sql
insert into devices (id, name, location) values ('canopy-01','Field unit 1','Plot A');
```

---

## ⚠️ Hardening before real use

The prototype RLS policies let the **anon key** read/insert/update captures and
write to Storage — fine for a bench demo, **not** for the open internet. Before
deploying for real:

- Give each device its own signed JWT or a shared secret checked inside the Edge
  Function (set `verify_jwt = true` and pass a device token).
- Restrict the storage/insert policies to that identity.
- Make the `captures` bucket private and serve images through signed URLs.
