const signIn = document.getElementById('signIn');
const signUp = document.getElementById('signUp');
const noAccount = document.getElementsByClassName('no-account');
const alertBox = document.querySelector('.alert');

// Alternar para SignUp
if (noAccount[0]) {
    noAccount[0].addEventListener('click', () => {
        signIn.style.transform = "translateX(300%)";
        signIn.style.opacity = "0";

        setTimeout(() => {
            signIn.style.display = "none";
            signUp.style.display = "flex";
            signUp.style.transform = "translateX(0%)";
            signUp.style.opacity = "1";
        }, 600);
    });
}

// Voltar para SignIn
if (noAccount[1]) {
    noAccount[1].addEventListener('click', () => {
        signUp.style.transform = "translateX(300%)";
        signUp.style.opacity = "0";

        setTimeout(() => {
            signUp.style.display = "none";
            signIn.style.display = "flex";
            signIn.style.transform = "translateX(0%)";
            signIn.style.opacity = "1";
        }, 600);
    });
}

// Lógica de Login
async function Login(event) {
    event.preventDefault();

    const email = document.getElementById("emailLog").value.trim();
    const password = document.getElementById("passLog").value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) return showAlert("Email inválido!", "error");
    if (password.length < 6) return showAlert("A senha deve ter pelo menos 6 caracteres!", "error");

    try {
        const response = await fetch("/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("userData", JSON.stringify(data.user));
            // Aguarda o alerta e processamento da sessão
            await showAlert(data.message || "Login realizado!", "success", data);
            
            setTimeout(() => {
                window.location.href = "http://localhost:5173/";
            }, 1500);
        } else {
            showAlert(data.message || "Credenciais inválidas", "error");
        }
    } catch (error) {
        showAlert("Erro de conexão com o servidor.", "error");
    }
}

// Lógica de Registro (Corrigida e Aprimorada)
async function Register(event) {
    event.preventDefault();

    const name = document.getElementById("nameReg").value.trim();
    const email = document.getElementById("emailReg").value.trim();
    const password = document.getElementById("passReg").value.trim();
    const confirmPassword = document.getElementById("passReg2").value.trim();

    // Regex aprimoradas
    const emailRegex = /^[^\s@]+@[^\s@]+\.(com|com\.br)$/
    const passwordRegex = /^\S{6,}$/;
    const nameRegex = /^[A-Za-zÀ-ÿ\s]{3,}$/;

    if (!name || !email || !password || !confirmPassword) {
        return showAlert("Todos os campos são obrigatórios!", "error");
    }
    if (!nameRegex.test(name)) {
        return showAlert("Nome inválido (mínimo 3 letras, sem números).", "error");
    }
    if (!emailRegex.test(email)) {
        return showAlert("O e-mail deve ser válido e terminar em .com ou .com.br");
    }
    if (password !== confirmPassword) {
        return showAlert("As senhas não coincidem!", "error");
    }
    if (!passwordRegex.test(password)) {
        return showAlert("A senha deve conter letras e números (mín. 6).", "error");
    }

    try {
        const response = await fetch("/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message || "Conta criada com sucesso!", "success");
            signUp.reset();
            // Retorna ao login após sucesso
            setTimeout(() => {
                if (noAccount[1]) noAccount[1].click();
            }, 2000);
        } else {
            showAlert(data.message || "Erro ao registrar usuário.", "error");
        }
    } catch (error) {
        showAlert("Erro na requisição: " + error.message, "error");
    }
}

// Função de alerta unificada
async function showAlert(message, type = "error", data = null) {
    if (!alertBox) return;

    // Reseta classes e define a nova
    alertBox.className = "alert"; 
    void alertBox.offsetWidth; // Trigger reflow para reiniciar animações CSS se houver
    alertBox.classList.add("show", type);
    alertBox.textContent = message;

    // Se for sucesso e houver dados de usuário, inicia sessão no backend
    if (type === "success" && data?.user) {
        try {
            await fetch("/app/initsession/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
        } catch (err) {
            console.error("Erro ao sincronizar sessão:", err);
        }
    }

    setTimeout(() => {
        alertBox.classList.remove("show");
    }, 3500);
}

// Listeners principais
if (signIn) signIn.addEventListener('submit', Login);
if (signUp) signUp.addEventListener('submit', Register);
