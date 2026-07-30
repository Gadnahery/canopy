// ============================================================================
// Canopy Densitometer — ALL-IN-ONE  (AI-Thinker ESP32-CAM)
//
// This single board does everything:
//   CAPTURE button -> snap photo -> upload JPEG to Supabase Storage
//                  -> call the process-capture Edge Function
//                  -> read canopy % from the response -> show on the I2C LCD.
// The second button is wired to the module's RESET/EN pin (hardware reset only).
//
// LCD sequence:  "Ready" -> "Capturing..." -> "Uploading..." ->
//                "Processing..." -> "Canopy: 74.6 %"
//
// ---- WIRING (AI-Thinker ESP32-CAM; SD card NOT used, so its pins are free) --
//   I2C LCD  SDA -> GPIO15      I2C LCD SCL -> GPIO14      LCD VCC 5V, GND GND
//   CAPTURE button -> GPIO13 to GND   (uses internal pull-up, active LOW)
//   RESET  button  -> EN pin to GND   (hardware reset)
//   Power the module from a solid 5V/1A+ supply (brown-outs kill camera init).
//
// ---- ARDUINO IDE SETUP -----------------------------------------------------
//   Board: "AI Thinker ESP32-CAM"   |   PSRAM: Enabled   |   Partition: Huge APP
//   Libraries: "LiquidCrystal I2C" (Frank de Brabander), ArduinoJson (Blanchon)
//   Credentials: put WiFi + Supabase values in secrets.h (see secrets.h.example).
//                Keep secrets.h in this same sketch folder so the IDE compiles it.
// ============================================================================

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ----------------------------- CONFIG ---------------------------------------
// WiFi + Supabase credentials live in secrets.h (copy secrets.h.example first).
#include "secrets.h"

#define BUCKET         "captures"

#define BUTTON_PIN     13
#define LCD_SDA        15
#define LCD_SCL        14
#define LCD_ADDR       0x27
#define LCD_COLS       16
#define LCD_ROWS       2
// ----------------------------------------------------------------------------

// AI-Thinker ESP32-CAM pin map
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

void lcdLine(uint8_t row, const String& msg) {
  lcd.setCursor(0, row);
  String s = msg; while (s.length() < LCD_COLS) s += ' ';
  lcd.print(s.substring(0, LCD_COLS));
}
void showIdle() { lcdLine(0, "Canopy Ready"); lcdLine(1, "Press Capture"); }

bool startCamera() {
  camera_config_t c;
  c.ledc_channel = LEDC_CHANNEL_0; c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM; c.pin_d2 = Y4_GPIO_NUM; c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM; c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM;
  c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM;
  c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000; c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size = FRAMESIZE_SVGA;          // 800x600 — plenty for a canopy ratio
  c.jpeg_quality = 12; c.fb_count = psramFound() ? 2 : 1;
  c.grab_mode = CAMERA_GRAB_LATEST; c.fb_location = CAMERA_FB_IN_PSRAM;
  return esp_camera_init(&c) == ESP_OK;
}

void connectWifi() {
  lcdLine(0, "WiFi connecting"); lcdLine(1, "");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint8_t t = 0;
  while (WiFi.status() != WL_CONNECTED && t++ < 40) delay(250);
}

// Upload the JPEG to Storage. Returns the object path (relative to bucket) or "".
String uploadImage(camera_fb_t* fb) {
  String path = String(DEVICE_ID) + "/" + String(millis()) + ".jpg";
  String url = "https://" SUPABASE_HOST "/storage/v1/object/" BUCKET "/" + path;

  WiFiClientSecure client; client.setInsecure();
  HTTPClient https;
  if (!https.begin(client, url)) return "";
  https.addHeader("apikey", SUPABASE_ANON);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON);
  https.addHeader("Content-Type", "image/jpeg");
  https.addHeader("x-upsert", "true");

  int code = https.POST(fb->buf, fb->len);
  https.end();
  return (code == 200 || code == 201) ? path : "";
}

// Call the Edge Function. Returns canopy_pct (>=0) or -1 on failure.
float processCapture(const String& imagePath) {
  String url = "https://" SUPABASE_HOST "/functions/v1/process-capture";
  WiFiClientSecure client; client.setInsecure();
  HTTPClient https;
  if (!https.begin(client, url)) return -1;
  https.addHeader("apikey", SUPABASE_ANON);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON);
  https.addHeader("Content-Type", "application/json");

  StaticJsonDocument<192> req;
  req["device_id"] = DEVICE_ID;
  req["image_path"] = imagePath;
  String payload; serializeJson(req, payload);

  int code = https.POST(payload);
  float pct = -1;
  if (code == 200) {
    StaticJsonDocument<512> resp;
    if (!deserializeJson(resp, https.getString()) && resp["ok"] == true) {
      pct = resp["capture"]["canopy_pct"].as<float>();
    }
  }
  https.end();
  return pct;
}

void runCapture() {
  lcdLine(0, "Capturing..."); lcdLine(1, "");
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) { lcdLine(0, "Camera error"); delay(2000); showIdle(); return; }

  lcdLine(0, "Uploading...");
  String path = uploadImage(fb);
  esp_camera_fb_return(fb);
  if (path == "") { lcdLine(0, "Upload failed"); delay(2000); showIdle(); return; }

  lcdLine(0, "Processing...");
  float pct = processCapture(path);
  if (pct < 0) { lcdLine(0, "Process failed"); delay(2000); showIdle(); return; }

  lcdLine(0, "Canopy Cover:");
  lcdLine(1, String(pct, 1) + " %");
  delay(7000);
  showIdle();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init(); lcd.backlight();
  lcdLine(0, "Canopy Densito"); lcdLine(1, "starting...");

  if (!startCamera()) { lcdLine(0, "Cam init FAIL"); lcdLine(1, "check power"); while (true) delay(1000); }
  connectWifi();
  if (WiFi.status() != WL_CONNECTED) { lcdLine(0, "WiFi FAIL"); delay(2000); }
  showIdle();
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {          // active-low
    delay(40);
    if (digitalRead(BUTTON_PIN) == LOW) {
      runCapture();
      while (digitalRead(BUTTON_PIN) == LOW) delay(10);   // wait for release
    }
  }
}
