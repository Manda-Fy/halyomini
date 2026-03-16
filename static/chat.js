const configRes = await fetch("/config");
const config = await configRes.json();
const API_BASE = config.api_base;

const params      = new URLSearchParams(window.location.search);
const roomId      = params.get("room_id");
const myPseudo    = params.get("your_pseudo");
const matchPseudo = params.get("match_pseudo");
const token       = sessionStorage.getItem("halyo_token");

// Redirige si les infos sont manquantes
if (!token || !roomId || !myPseudo) {
    window.location.href = "index.html";
}

// Mise à jour du header avec le pseudo du match
document.getElementById("chatPartnerName").textContent = matchPseudo || "Halyo";
document.getElementById("statusText").textContent = "Connecté";

const messagesContainer = document.getElementById("messagesContainer");
const messageInput      = document.getElementById("messageInput");
const typingIndicator   = document.getElementById("typingIndicator");

// Connexion WebSocket
const socket = io(API_BASE);

socket.on("connect", () => {
    socket.emit("join", { room_id: roomId, token: token });
    document.getElementById("statusText").textContent = "En ligne";
    loadHistory();
});

socket.on("disconnect", () => {
    document.getElementById("statusText").textContent = "Déconnecté";
});

socket.on("message", (data) => {
    cacherIndicateurEcriture();
    afficherMessage(data.pseudo, data.content, data.created_at);
});

socket.on("status", (data) => {
    afficherStatut(data.message);
});

socket.on("error", (data) => {
    console.error("Erreur :", data.message);
    if (data.message === "Token invalide") {
        window.location.href = "index.html";
    }
});

// Indicateur de frappe
let typingTimeout;
socket.on("typing", (data) => {
    if (data.pseudo !== myPseudo) {
        afficherIndicateurEcriture();
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(cacherIndicateurEcriture, 2000);
    }
});


async function loadHistory() {
    try {
        const res = await fetch(`${API_BASE}/messages/${roomId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            window.location.href = "index.html";
            return;
        }

        const msgs = await res.json();

        // Supprime le message de bienvenue si l'historique n'est pas vide
        if (msgs.length > 0) {
            const welcome = messagesContainer.querySelector(".welcome-message");
            if (welcome) welcome.remove();
        }

        msgs.forEach(m => afficherMessage(m.pseudo, m.content, m.created_at));

    } catch (err) {
        console.error("Erreur chargement historique :", err);
    }
}


function envoyerMessage() {
    const content = messageInput.value.trim();
    if (!content || content.length > 1000) return;

    socket.emit("message", {
        room_id: roomId,
        token:   token,
        content: content,
    });

    messageInput.value = "";
    messageInput.style.height = "auto";
}


function afficherMessage(pseudo, content, createdAt) {
    // Supprime le message de bienvenue au premier message reçu
    const welcome = messagesContainer.querySelector(".welcome-message");
    if (welcome) welcome.remove();

    const isMine = pseudo === myPseudo;
    const heure  = new Date(createdAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit"
    });

    const div = document.createElement("div");
    div.className = `message ${isMine ? "message-mine" : "message-theirs"}`;
    div.innerHTML = `
        <div class="message-bubble">
            <p class="message-content">${escapeHtml(content)}</p>
            <span class="message-time">${heure}</span>
        </div>
    `;

    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function afficherStatut(texte) {
    const div = document.createElement("div");
    div.className   = "status-message";
    div.textContent = texte;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function afficherIndicateurEcriture() {
    typingIndicator.style.display = "flex";
}

function cacherIndicateurEcriture() {
    typingIndicator.style.display = "none";
}


function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


// Soumission du formulaire
document.getElementById("messageForm").addEventListener("submit", (e) => {
    e.preventDefault();
    envoyerMessage();
});

// Envoi avec Entrée, retour à la ligne avec Shift+Entrée
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        envoyerMessage();
    }
});

// Indicateur de frappe envoyé au partenaire
messageInput.addEventListener("input", () => {
    // Ajustement automatique de la hauteur du textarea
    messageInput.style.height = "auto";
    messageInput.style.height = messageInput.scrollHeight + "px";

    socket.emit("typing", { room_id: roomId, pseudo: myPseudo });
});

// Bouton fin de conversation
document.getElementById("endChatBtn").addEventListener("click", () => {
    socket.emit("leave", { room_id: roomId, token: token });
    window.location.href = "index.html";
});
