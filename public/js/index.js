// Menu mobile toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const contactForm = document.getElementById("contactForm");
const startNow = document.getElementById("startNow");



startNow.addEventListener('click', async () => {
    try {
        const response = await fetch("/app/statussession");
        const res = await response.json(); // agora é o objeto JSON

        console.log(res);

        if (res.message !== "Nenhuma sessão ativa") {
            // Usuário já tem sessão salva
            window.location.href = "http://localhost:5173/";
        } else {
            // Não há sessão, redireciona para login
            window.location.href = "./pages/sign.html";
        }
    } catch (err) {
        console.log("Erro no processo: ", err.message);
    }
});


contactForm.addEventListener("submit", sendContact);

// Flag para controlar quando é clique do utilizador
let isClicking = false;

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');

        const icon = navToggle.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.remove('bi-list');
            icon.classList.add('bi-x');
        } else {
            icon.classList.remove('bi-x');
            icon.classList.add('bi-list');
        }
    });
}

// Função para remover active de todos os links
function removeActiveClasses() {
    navLinks.forEach(link => link.classList.remove('active'));
}

// Função para ativar link por ID
function setActiveLink(id) {
    removeActiveClasses();
    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
        }
    });
}

// Clique nos links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        isClicking = true;

        removeActiveClasses();
        link.classList.add('active');

        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const icon = navToggle.querySelector('i');
            icon.classList.remove('bi-x');
            icon.classList.add('bi-list');
        }

        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }

        setTimeout(() => {
            isClicking = false;
        }, 500);
    });
});

// Scroll spy
window.addEventListener('scroll', () => {
    if (isClicking) return;

    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 150;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
            setActiveLink(sectionId);
        }
    });
});

// Detectar secção ativa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 150;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
            setActiveLink(sectionId);
        }
    });
});

function sendContact(event) {
    event.preventDefault();

    const message = document.getElementById("contactMsm");
    const num = "244953386851";

    window.location.href = `https://wa.me/${num}?text=${encodeURIComponent(message.value)}`;
}
