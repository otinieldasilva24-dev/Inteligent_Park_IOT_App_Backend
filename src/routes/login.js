const db = require("../config/sqlite3");

async function Login(req, res) {
    const { email, password } = req.body;
    try {
        db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
            if (err) {
                console.error("Erro ao consultar o banco de dados: ", err.message);
                return res.status(500).json({ message: "Erro interno do servidor" });
            }
            if (row) {
                return res.status(200).json({ message: "Login bem-sucedido", user: row });
            } else {
                return res.status(401).json({ message: "Credenciais inválidas" });
            }
        });
    } catch (error) {
        console.error("Erro ao processar o login: ", error.message);
        return res.status(500).json({ message: "Erro interno do servidor" });
    }

}

module.exports =  Login