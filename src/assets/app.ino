#include <Ultrasonic.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Credenciais WiFi
const char *ssid = "OTINIEL";

const char *password = "Otinieldasilva25";

Ultrasonic ultrasonic1(13, 12);
Ultrasonic ultrasonic2(14, 27);
Ultrasonic ultrasonic3(26, 25);
Ultrasonic ultrasonic4(33, 32);

// URL do servidor
const char *serverUrl = "http:// 10.253.199.232:3000/user/ultrassonicdata";

// Controle de tempo sem usar delay
unsigned long lastRequest = 0;
const unsigned long INTERVAL = 200; // 4 segundos

// Classe pra cada conjuto de leds
class newLed
{
private:
  int livre;
  int ocuped;
  int waiting;

public:
  newLed(int a, int b, int c)
  {
    livre = a;
    ocuped = b;
    waiting = c;
  }

  void Begin()
  {
    pinMode(livre, OUTPUT);
    pinMode(ocuped, OUTPUT);
    pinMode(waiting, OUTPUT);
  }

  void getStatus(int a, int b, int c)
  {
    digitalWrite(livre, a);
    digitalWrite(ocuped, b);
    digitalWrite(waiting, c);
  }
};

// Criacao de cada objecto
newLed painel1(15, 2, 4);

void setup()
{
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  painel1.Begin();

  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
  Serial.println(WiFi.localIP());

  // Envia dados logo ao iniciar
  sendPostRequest();
}

void loop()
{
  // Executa a cada INTERVAL sem travar o loop
  if (millis() - lastRequest >= INTERVAL)
  {
    sendPostRequest();
    lastRequest = millis();
  }
}

void sendPostRequest()
{
  if (WiFi.status() == WL_CONNECTED)
  {

    int distance1 = ultrasonic1.read(CM);
    int distance2 = ultrasonic2.read(CM);
    int distance3 = ultrasonic3.read(CM);
    int distance4 = ultrasonic4.read(CM);


    Serial.print("Distância: ");
    Serial.println(distance);
    String vaga1 = (distance1 <= 5) ? "ocupada" : "livre";
    String vaga2 = (distance2 <= 5) ? "ocupada" : "livre";
    String vaga3 = (distance3 <= 5) ? "ocupada" : "livre";
    String vaga4 = (distance4 <= 5) ? "ocupada" : "livre";
    String vaga5 = "livre"; // Simulação
    String vaga6 = "livre"; // Simulação


    String reserved1 = "";
    String reserved2 = "";
    String reserved3 = "";
    String reserved4 = "";

    painel1.getStatus(
        ((vaga1 == "ocupada") ? HIGH : LOW),
        ((reserved1 == "ok") ? HIGH : LOW),
        ((vaga1 == "livre") ? HIGH : LOW));

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Criando JSON com ArduinoJson
    StaticJsonDocument<256> doc;
    JsonObject vagas = doc.createNestedObject("vagas");

    // Aqui podes substituir por leituras reais dos sensores
    vagas["vaga1"] = vaga1;
    vagas["vaga2"] = vaga2;
    vagas["vaga3"] = vaga3;
    vagas["vaga4"] = vaga4;
    vagas["vaga5"] = vaga5;
    vagas["vaga6"] = vaga6;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0)
    {
      Serial.print("Código de resposta: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("Resposta do servidor:");
      Serial.println(response);
    }
    else
    {
      Serial.print("Erro na requisição: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
  else
  {
    Serial.println("WiFi desconectado. Tentando reconectar...");
    WiFi.begin(ssid, password);
  }
}
