// ============================================================================
// Canopy Densitometer — ESP32 CONTROLLER  (NodeMCU ESP32-S 38-pin, your PCB)
//
// Two-device design: this board owns the BUTTON and the LCD. It does NOT touch
// the camera. On a button press it asks the ESP32-CAM (via Supabase) to shoot:
//   1. button press  -> INSERT a captures row (status 'requested'), get its id
//   2. poll that row  -> drive the LCD off its status:
//        requested/uploading -> "Capturing..." / "Uploading..."
//        uploaded/processing -> "Processing..."
//        done  -> "Canopy: 74.6 %"     error -> "Error - retry"
// The ESP32-CAM watches for the 'requested' row, captures, uploads, processes.
//
// Pins (per your schematic / PCB):
//   I2C LCD : SDA = GPIO21, SCL = GPIO22, 0x27, 16x2   (+5V, GND)
//   Button  : GPIO25 -> button -> GND   (internal pull-up, active LOW)
//   Reset   : wired to EN (hardware reset)
//
// Libraries: "LiquidCrystal I2C" (Frank de Brabander), ArduinoJson.
// Credentials in secrets.h (copy secrets.h.example).
// ============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "secrets.h"

#define REST_BASE          "https://" SUPABASE_HOST "/rest/v1"
#define BUTTON_PIN         25
#define BUTTON_ACTIVE_LOW  1        // button to GND; flip to 0 if wired to 3.3V
#define LCD_ADDR           0x27
#define LCD_COLS           16
#define LCD_ROWS           2
#define POLL_MS            800
#define CAPTURE_TIMEOUT_MS 30000

LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);
String activeId = "";
unsigned long captureStart = 0, lastPoll = 0;
String lastStatus = "";

void lcdLine(uint8_t row, const String& msg) {
  lcd.setCursor(0, row);
  String s = msg; while (s.length() < LCD_COLS) s += ' ';
  lcd.print(s.substring(0, LCD_COLS));
}
void showIdle() { lcdLine(0, "Canopy Ready"); lcdLine(1, "Press Capture"); }

bool buttonPressed() {
  int v = digitalRead(BUTTON_PIN);
  return BUTTON_ACTIVE_LOW ? (v == LOW) : (v == HIGH);
}

void addAuth(HTTPClient& h) {
  h.addHeader("apikey", SUPABASE_ANON);
  h.addHeader("Authorization", "Bearer " SUPABASE_ANON);
}

void connectWifi() {
  lcdLine(0, "WiFi connecting"); lcdLine(1, "");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint8_t t = 0;
  while (WiFi.status() != WL_CONNECTED && t++ < 40) delay(250);
}

// Insert a 'requested' row; returns its id (or "").
String requestCapture() {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, REST_BASE "/captures");
  addAuth(h);
  h.addHeader("Content-Type", "application/json");
  h.addHeader("Prefer", "return=representation");
  int code = h.POST(String("{\"device_id\":\"" DEVICE_ID "\",\"status\":\"requested\"}"));
  String id = "";
  if (code == 200 || code == 201) {
    StaticJsonDocument<512> d;
    if (!deserializeJson(d, h.getString()) && d.is<JsonArray>() && d.size() > 0)
      id = d[0]["id"].as<String>();
  }
  h.end();
  return id;
}

bool pollCapture(String& status, float& canopy) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient h;
  h.begin(client, String(REST_BASE) + "/captures?id=eq." + activeId + "&select=status,canopy_pct");
  addAuth(h);
  int code = h.GET();
  bool ok = false;
  if (code == 200) {
    StaticJsonDocument<256> d;
    if (!deserializeJson(d, h.getString()) && d.is<JsonArray>() && d.size() > 0) {
      status = d[0]["status"].as<String>();
      canopy = d[0]["canopy_pct"].isNull() ? -1.0f : d[0]["canopy_pct"].as<float>();
      ok = true;
    }
  }
  h.end();
  return ok;
}

void renderStatus(const String& status, float canopy) {
  if (status == lastStatus && status != "done") return;
  lastStatus = status;
  if (status == "requested")       lcdLine(0, "Capturing...");
  else if (status == "uploading")  lcdLine(0, "Uploading...");
  else if (status == "uploaded" ||
           status == "processing") lcdLine(0, "Processing...");
  else if (status == "done") {
    lcdLine(0, "Canopy Cover:");
    lcdLine(1, String(canopy, 1) + " %");
    return;
  } else if (status == "error")    lcdLine(0, "Error - retry");
  lcdLine(1, "");
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);   // button to GND (active LOW)
  Wire.begin(21, 22);
  lcd.init(); lcd.backlight();
  lcdLine(0, "Canopy Densito"); lcdLine(1, "starting...");
  connectWifi();
  if (WiFi.status() != WL_CONNECTED) { lcdLine(0, "WiFi FAIL"); delay(2000); }
  showIdle();
}

void loop() {
  if (activeId == "") {
    if (buttonPressed()) {
      delay(40);
      if (buttonPressed()) {
        lcdLine(0, "Capturing..."); lcdLine(1, "");
        String id = requestCapture();
        if (id == "") { lcdLine(0, "Request failed"); delay(1500); showIdle(); }
        else { activeId = id; captureStart = millis(); lastStatus = ""; }
        while (buttonPressed()) delay(10);   // wait for release
      }
    }
    return;
  }

  if (millis() - lastPoll >= POLL_MS) {
    lastPoll = millis();
    String status; float canopy;
    if (pollCapture(status, canopy)) {
      renderStatus(status, canopy);
      if (status == "done" || status == "error") {
        delay(6000); activeId = ""; showIdle(); return;
      }
    }
  }
  if (millis() - captureStart > CAPTURE_TIMEOUT_MS) {
    lcdLine(0, "Timeout"); lcdLine(1, "Try again");
    delay(2500); activeId = ""; showIdle();
  }
}
