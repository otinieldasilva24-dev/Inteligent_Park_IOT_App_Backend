// Importação de Libs
const express = require('express');
const path = require('path');
const http = require("http");
const WebSocket = require("ws");

const Login = require("./src/routes/login");
const Register = require("./src/routes/signup");
const Agent = require("./src/routes/agent");
const ContextExtractor = require("./src/routes/contex");


const ultrassonicData = require("./src/routes/ultrassonicData");
const cors = require("cors");


// Configuração do servidor
const app = express();
const PORT = 3000;
app.use(cors());

let dataSession = {};
let parkingData = {};

// Conjunto para armazenar clientes WebSocket conectados
const clients = new Set();

// Função para calcular e enviar resumo para todos os clientes
function broadcastSummary() {
  let summary = { ocuped: 0, free: 0, total: 0 };
  for (let key in parkingData) {
    if (parkingData[key] === "ocupada") summary.ocuped++;
    if (parkingData[key] === "livre") summary.free++;
    summary.total++;
  }
  const message = JSON.stringify(summary);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas HTTP normais
app.post('/user/login', Login);
app.post('/user/register', Register);
app.post("/user/ultrassonicdata", (req, res) => ultrassonicData(req, res, parkingData, broadcastSummary));
app.post("/ask", Agent);
app.post("/ask/context", ContextExtractor);


// Rota da sessão
app.post("/app/initsession/", (req, res) => {
  // Atualiza o estado da sessão com os dados recebidos
  dataSession = req.body;
  console.log("Estado de sessão iniciado: ", dataSession);

  res.json({ message: "Sessão iniciada com sucesso", session: dataSession });
});

app.get("/app/statussession", (req, res) => {
  if (dataSession && Object.keys(dataSession).length > 0) {
    res.json(dataSession);
  } else {
    res.status(404).json({ message: "Nenhuma sessão ativa" });
  }

  console.log("Rota Acessada! ");
});




// Rota HTTP para resumo dos dados
app.get("/user/parkingdata", (req, res) => {
  let summary = { ocuped: 0, free: 0, total: 0 };

  if (Object.keys(parkingData).length === 0) {
    return res.status(404).json({ ocuped: null, free: null, total: null });
  }

  for (let key in parkingData) {
    if (parkingData[key] === "ocupada") summary.ocuped++;
    if (parkingData[key] === "livre") summary.free++;
    summary.total++;
  }

  return res.json(summary);
});

// Cria servidor HTTP base
const server = http.createServer(app);

// Servidor WebSocket ligado ao mesmo servidor
const wss = new WebSocket.Server({ server, path: "/user/parkingdata" });

wss.on("connection", (ws) => {
  console.log("Cliente conectado via WebSocket!");
  clients.add(ws);

  // Envia dados iniciais
  ws.send(JSON.stringify(parkingData));

  ws.on("close", () => {
    console.log("Cliente desconectado.");
    clients.delete(ws);
  });
});

// Atualização periódica
setInterval(broadcastSummary, 500);

// Inicialização do servidor
server.listen(PORT, () => {
  console.log('Conectando', '.'.repeat(40));
  console.log('•'.repeat(50));
  console.log('Servidor Inicializado! ', '✓'.repeat(27));
  console.log(`HTTP disponível em http://localhost:${PORT}/app.html`);
  console.log(`WebSocket ativo em ws://localhost:${PORT}/user/parkingdata`);
  console.log("Inicializando conexão com o Banco de dados SQLite3", ".".repeat(20));
});
