// Variables globales
var API_BASE;
var roomId;
var myPseudo;
var matchPseudo;
var token;
var messagesContainer;
var messageInput;
var typingIndicator;
var socket;

// Initialisation asynchrone
(async function init() {
    var configRes = await fetch("/config");
    var config = await configRes.json();
    API_BASE = config.api_base;

    var params = new URLSearchParams(window.location.search);
    roomId = params.get("room_id");
    myPseudo = params.get("your_pseudo");
    matchPseudo = params.get("match_pseudo");
    token = sessionStorage.getItem("halyo_token");
    
    // Sauvegarder les infos de conversation dans localStorage
    var conversationKey = "halyo_conv_" + roomId;
    localStorage.setItem(conversationKey, JSON.stringify({
        roomId: roomId,
        myPseudo: myPseudo,
        matchPseudo: matchPseudo,
        token: token
    }));

    if (!token || !roomId || !myPseudo) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("chatPartnerName").textContent = matchPseudo || "Halyo";
    document.getElementById("statusText").textContent = "Connecte";

    messagesContainer = document.getElementById("messagesContainer");
    messageInput = document.getElementById("messageInput");
    typingIndicator = document.getElementById("typingIndicator");

    socket = io(API_BASE);

    socket.on("connect", function() {
        socket.emit("join", { room_id: roomId, token: token });
        document.getElementById("statusText").textContent = "En ligne";
        loadHistory();
    });

    socket.on("disconnect", function() {
        document.getElementById("statusText").textContent = "Deconnecte";
    });

    socket.on("message", function(data) {
        cacherIndicateurEcriture();
        afficherMessage(data.pseudo, data.content, data.created_at);
    });

    socket.on("status", function(data) {
        afficherStatut(data.message);
    });

    socket.on("error", function(data) {
        console.error("Erreur :", data.message);
        if (data.message === "Token invalide") {
            window.location.href = "index.html";
        }
    });

    var typingTimeout;
    socket.on("typing", function(data) {
        if (data.pseudo !== myPseudo) {
            afficherIndicateurEcriture();
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(cacherIndicateurEcriture, 2000);
        }
    });

    async function loadHistory() {
        var messagesKey = "halyo_messages_" + roomId;
        
        // Charger les messages sauvegardés depuis localStorage
        var savedMessages = localStorage.getItem(messagesKey);
        if (savedMessages) {
            var localMsgs = JSON.parse(savedMessages);
            if (localMsgs.length > 0) {
                var welcome = messagesContainer.querySelector(".welcome-message");
                if (welcome) welcome.remove();
                
                localMsgs.forEach(function(m) {
                    afficherMessage(m.pseudo, m.content, m.created_at);
                });
            }
        }

        try {
            var res = await fetch(API_BASE + "/messages/" + roomId, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (res.status === 401 || res.status === 403) {
                window.location.href = "index.html";
                return;
            }

            var msgs = await res.json();

            if (msgs.length > 0) {
                var welcome = messagesContainer.querySelector(".welcome-message");
                if (welcome) welcome.remove();
            }

            // Sauvegarder les messages du serveur dans localStorage
            localStorage.setItem(messagesKey, JSON.stringify(msgs));

            msgs.forEach(function(m) {
                afficherMessage(m.pseudo, m.content, m.created_at);
            });

        } catch (err) {
            console.error("Erreur chargement historique :", err);
        }
    }

    window.envoyerMessage = function() {
        var content = messageInput.value.trim();
        if (!content || content.length > 1000) return;

        socket.emit("message", {
            room_id: roomId,
            token: token,
            content: content
        });

        messageInput.value = "";
        messageInput.style.height = "auto";
    };

    function afficherMessage(pseudo, content, createdAt) {
        var welcome = messagesContainer.querySelector(".welcome-message");
        if (welcome) welcome.remove();

        var isMine = pseudo && myPseudo && pseudo.trim().toLowerCase() === myPseudo.trim().toLowerCase();
        var date = new Date(createdAt);
        var heure = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        var div = document.createElement("div");
        div.className = "message " + (isMine ? "sent" : "received");
        div.innerHTML = "<div class=\"message-bubble\"><p class=\"message-content\">" + escapeHtml(content) + "</p><span class=\"message-time\">" + heure + "</span></div>";

        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Sauvegarder le message dans localStorage
        var messagesKey = "halyo_messages_" + roomId;
        var savedMessages = localStorage.getItem(messagesKey);
        var messages = savedMessages ? JSON.parse(savedMessages) : [];
        messages.push({ pseudo: pseudo, content: content, created_at: createdAt });
        localStorage.setItem(messagesKey, JSON.stringify(messages));
    }

    function afficherStatut(texte) {
        var div = document.createElement("div");
        div.className = "status-message";
        div.textContent = texte;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    window.afficherIndicateurEcriture = function() {
        typingIndicator.style.display = "flex";
    };

    window.cacherIndicateurEcriture = function() {
        typingIndicator.style.display = "none";
    };

    function escapeHtml(text) {
        var div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    document.getElementById("messageForm").addEventListener("submit", function(e) {
        e.preventDefault();
        window.envoyerMessage();
    });

    messageInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            window.envoyerMessage();
        }
    });

    messageInput.addEventListener("input", function() {
        messageInput.style.height = "auto";
        messageInput.style.height = messageInput.scrollHeight + "px";

        socket.emit("typing", { room_id: roomId, pseudo: myPseudo });
    });

    document.getElementById("endChatBtn").addEventListener("click", function() {
        socket.emit("leave", { room_id: roomId, token: token });
        window.location.href = "index.html";
    });
})();
