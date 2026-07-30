// ============================================================================
// Canopy Densitometer — ESP32-CAM WORKER  (AI-Thinker ESP32-CAM)
//
// Two-device design: this board does NO buttons and NO LCD. It just:
//   1. watches Supabase for a capture row with status 'requested'
//      (created by the ESP32 board when its button is pressed),
//   2. takes the photo, uploads the JPEG to Storage,
//   3. calls the process-capture Edge Function (canopy % is computed there).
// The ESP32 board polls the same row and shows the result on its LCD.
//
// Only the camera + a 5V/GND supply are needed here. No other wiring.
// (Serial: send 'r' to insert a test request without the ESP32 board.)
//
// Arduino IDE: Board "AI Thinker ESP32-CAM", PSRAM Enabled, Partition Huge APP.
// Credentials in secrets.h (copy secrets.h.example).
// ============================================================================

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "secrets.h"

#define BUCKET     "captures"
#define REST_BASE  "https://" SUPABASE_HOST "/rest/v1"
#define POLL_MS    1500

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

unsigned long lastPoll = 0;

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
  c.frame_size = FRAMESIZE_SVGA; c.jpeg_quality = 12;
  c.fb_count = psramFound() ? 2 : 1;
  c.grab_mode = CAMERA_GRAB_LATEST; c.fb_location = CAMERA_FB_IN_PSRAM;
  return esp_camera_init(&c) == ESP_OK;
}

void connectWifi() {
  Serial.printf("[wifi] connecting to \"%s\" ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint8_t t = 0;
  while (WiFi.status() != WL_CONNECTED && t++ < 40) { delay(250); Serial.print('.'); }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("[wifi] connected, IP %s, RSSI %d\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  else
    Serial.println("[wifi] FAILED");
}

// --- Supabase helpers -------------------------------------------------------
void addAuth(HTTPClient& h) {
  h.addHeader("apikey", SUPABASE_ANON);
  h.addHeader("Authorization", "Bearer " SUPABASE_ANON);
}

// Oldest 'requested' row for this device, or "" if none.
String fetchRequestedId() {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, REST_BASE "/captures?device_id=eq." DEVICE_ID
                  "&status=eq.requested&select=id&order=created_at.asc&limit=1");
  addAuth(h);
  int code = h.GET();
  String id = "";
  if (code == 200) {
    StaticJsonDocument<192> d;
    if (!deserializeJson(d, h.getString()) && d.is<JsonArray>() && d.size() > 0)
      id = d[0]["id"].as<String>();
  }
  h.end();
  return id;
}

bool patchCapture(const String& id, const String& body) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, String(REST_BASE) + "/captures?id=eq." + id);
  addAuth(h);
  h.addHeader("Content-Type", "application/json");
  int code = h.sendRequest("PATCH", (uint8_t*)body.c_str(), body.length());
  h.end();
  return code == 200 || code == 204;
}

bool uploadImage(camera_fb_t* fb, const String& path) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, String("https://" SUPABASE_HOST "/storage/v1/object/" BUCKET "/") + path);
  addAuth(h);
  h.addHeader("Content-Type", "image/jpeg");
  h.addHeader("x-upsert", "true");
  int code = h.POST(fb->buf, fb->len);
  Serial.printf("[upload] HTTP %d\n", code);
  h.end();
  return code == 200 || code == 201;
}

bool callProcess(const String& id) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, "https://" SUPABASE_HOST "/functions/v1/process-capture");
  addAuth(h);
  h.addHeader("Content-Type", "application/json");
  int code = h.POST(String("{\"capture_id\":\"") + id + "\"}");
  Serial.printf("[process] HTTP %d\n", code);
  h.end();
  return code == 200;
}

// Full job for one requested capture.
void handleRequest(const String& id) {
  Serial.printf("[req] handling %s\n", id.c_str());
  patchCapture(id, "{\"status\":\"uploading\"}");   // claim it

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[cam] capture FAILED");
    patchCapture(id, "{\"status\":\"error\",\"error\":\"camera capture failed\"}");
    return;
  }
  Serial.printf("[cam] frame %u bytes\n", (unsigned)fb->len);

  String path = String(DEVICE_ID) + "/" + id + ".jpg";
  bool up = uploadImage(fb, path);
  esp_camera_fb_return(fb);
  if (!up) {
    patchCapture(id, "{\"status\":\"error\",\"error\":\"upload failed\"}");
    return;
  }
  patchCapture(id, String("{\"image_path\":\"") + path + "\",\"status\":\"uploaded\"}");
  callProcess(id);   // Edge Function computes canopy % and marks it done
}

// Test helper: pretend the ESP32 pressed its button.
void insertTestRequest() {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, REST_BASE "/captures");
  addAuth(h);
  h.addHeader("Content-Type", "application/json");
  int code = h.POST(String("{\"device_id\":\"" DEVICE_ID "\",\"status\":\"requested\"}"));
  Serial.printf("[test] inserted request HTTP %d\n", code);
  h.end();
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n\n[canopy-cam] boot");
  if (!startCamera()) {
    Serial.println("[cam] init FAILED - check 5V power / ribbon cable");
    while (true) delay(1000);
  }
  Serial.println("[cam] init OK");
  connectWifi();
  Serial.println("[canopy-cam] watching for capture requests (send 'r' to self-test)");
}

void loop() {
  if (Serial.available()) { char c = Serial.read(); if (c == 'r' || c == 'R') insertTestRequest(); }

  if (millis() - lastPoll >= POLL_MS) {
    lastPoll = millis();
    if (WiFi.status() != WL_CONNECTED) { connectWifi(); return; }
    String id = fetchRequestedId();
    if (id != "") handleRequest(id);
  }
}
