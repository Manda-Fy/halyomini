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
    token = params.get("token") || sessionStorage.getItem("halyo_token");
    
    // Récupérer depuis sessionStorage si pas en URL params
    if (!roomId) roomId = sessionStorage.getItem("halyo_room_id");
    if (!myPseudo) myPseudo = sessionStorage.getItem("halyo_your_pseudo");
    if (!matchPseudo) matchPseudo = sessionStorage.getItem("halyo_match_pseudo");
    
    // Debug logs améliorés
    console.log("Chat.js initialization:", {
        roomId: roomId,
        myPseudo: myPseudo,
        matchPseudo: matchPseudo,
        token: token ? "present" : "missing"
    });
    
    // Sauvegarder les infos de conversation dans localStorage
    var conversationKey = "halyo_conv_" + roomId;
    localStorage.setItem(conversationKey, JSON.stringify({
        roomId: roomId,
        myPseudo: myPseudo,
        matchPseudo: matchPseudo,
        token: token
    }));

    if (!token || !roomId || !myPseudo) {
        console.error("Missing required parameters:", { token: !!token, roomId: !!roomId, myPseudo: !!myPseudo });
        window.location.href = "index.html";
        return;
    }

    // Afficher le pseudo du partenaire avec fallback
    var displayName = matchPseudo && matchPseudo.trim() ? matchPseudo.trim() : "Halyo";
    if (displayName === "Utilisateur inconnu" || displayName === "utilisateur inconnue" || displayName === "Correspondant") {
        displayName = "Correspondant anonyme";
    }
    document.getElementById("chatPartnerName").textContent = displayName;
    document.getElementById("statusText").textContent = "Connecte";

    messagesContainer = document.getElementById("messagesContainer");
    messageInput = document.getElementById("messageInput");
    typingIndicator = document.getElementById("typingIndicator");

    socket = io(API_BASE);

    socket.on("connect", function() {
        document.getElementById("statusText").textContent = "En ligne";
        
        // Charger l'historique AVANT de rejoindre pour éviter les race conditions
        loadHistory().then(function() {
            console.log("Historique chargé, maintenant on rejoint la room");
            socket.emit("join", { room_id: roomId, token: token });
        });
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
        
        try {
            console.log("Chargement de l'historique pour room:", roomId);
            
            var res = await fetch(API_BASE + "/messages/" + roomId, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (res.status === 401 || res.status === 403) {
                console.error("Accès refusé au récupérer les messages");
                window.location.href = "index.html";
                return;
            }

            var msgs = await res.json();
            console.log("Messages reçus du serveur:", msgs.length);

            if (msgs.length > 0) {
                var welcome = messagesContainer.querySelector(".welcome-message");
                if (welcome) welcome.remove();
                
                // Ajouter tous les messages
                msgs.forEach(function(m) {
                    afficherMessage(m.pseudo, m.content, m.created_at);
                });
                
                // Sauvegarder dans localStorage
                localStorage.setItem(messagesKey, JSON.stringify(msgs));
            }

        } catch (err) {
            console.error("Erreur chargement historique :", err);
        }
        
        return true; // Signal que loadHistory est terminé
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
        if (!pseudo || !content) {
            console.warn("Message ignoré - pseudo ou content vide", {pseudo, content});
            return;
        }

        var welcome = messagesContainer.querySelector(".welcome-message");
        if (welcome) welcome.remove();

        var isMine = pseudo && myPseudo && pseudo.trim().toLowerCase() === myPseudo.trim().toLowerCase();
        var date = new Date(createdAt);
        var heure = date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        // Debug log
        console.log("Message affiché:", {
            pseudo: pseudo,
            myPseudo: myPseudo,
            isMine: isMine,
            messageClass: isMine ? "sent" : "received",
            preview: content.substring(0, 30)
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
