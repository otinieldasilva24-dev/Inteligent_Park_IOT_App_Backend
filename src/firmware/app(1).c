// code do esp32 ( v2 )

#include <Ultrasonic.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Configurações de Rede
const char* ssid = "Assembly";
const char* password = "";
const char* apiBase = "http://192.168.8.84:3000";
const String sendUrl = String(apiBase) + "/park/data/receiv";

// Constantes de Estado
const int ON = HIGH;
const int OFF = LOW;
const unsigned long INTERVALO_ENVIO = 5000; // Envia a cada 5 segundos (evita spam na API)
unsigned long ultimoEnvio = 0;

// Definição dos Sensores
Ultrasonic sensores[3] = {
  Ultrasonic(2, 4),
  Ultrasonic(5, 18),
  Ultrasonic(19, 21)
};

class Painel {
private:
  int pinFree;
  int pinOccupied;
  bool isFree = false;

public:
  Painel(int f, int o) : pinFree(f), pinOccupied(o) {}

  void begin() {
    pinMode(pinFree, OUTPUT);
    pinMode(pinOccupied, OUTPUT);
    updateLeds();
  }

  void setStatus(bool free) {
    if (isFree != free) { // Só atualiza se houver mudança (performance)
      isFree = free;
      updateLeds();
    }
  }

  void updateLeds() {
    digitalWrite(pinFree, isFree ? ON : OFF);
    digitalWrite(pinOccupied, isFree ? OFF : ON);
  }

  bool getIsFree() { return isFree; }
};

// Instanciação dos Painéis (LEDs)
Painel paneis[3] = {
  Painel(13, 12),
  Painel(14, 27),
  Painel(26, 25)
};

void setup() {
  Serial.begin(115200);
  
  // Inicializa Hardware
  for (int i = 0; i < 3; i++) paneis[i].begin();

  // Conexão WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Conectado!");
}

void sendDados() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(sendUrl);
  http.addHeader("Content-Type", "application/json");

  JsonDocument doc;
  int freeCount = 0;

  for (int i = 0; i < 3; i++) {
    if (paneis[i].getIsFree()) freeCount++;
  }

  // Estrutura de dados otimizada
  JsonObject data = doc["data"].to<JsonObject>();
  data["free"] = freeCount;
  data["occupied"] = 3 - freeCount;
  data["total"] = 3;

  String jsonExport;
  serializeJson(doc, jsonExport);

  int httpCode = http.POST(jsonExport);
  
  if (httpCode > 0) {
    Serial.printf("[HTTP] POST... código: %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] Erro: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

void loop() {
  // 1. Leitura Dinâmica dos Sensores
  for (int i = 0; i < 3; i++) {
    long distancia = sensores[i].read();
    
    // Filtro: Se a distância for 0, o sensor geralmente falhou ou está fora de alcance
    // Consideramos "free" se maior que 5cm ou falha (ajuste conforme o sensor físico)
    bool statusAtual = (distancia > 5 || distancia == 0);
    
    paneis[i].setStatus(statusAtual);

    // Debug opcional
    if (millis() % 2000 == 0) { // Log a cada 2 segundos
       Serial.printf("Vaga %d: %ld cm | %s\n", i + 1, distancia, statusAtual ? "LIVRE" : "OCUPADA");
    }
  }

  // 2. Envio de Dados Temporizado (Não bloqueante)
  if (millis() - ultimoEnvio >= INTERVALO_ENVIO) {
    sendDados();
    ultimoEnvio = millis();
  }
}