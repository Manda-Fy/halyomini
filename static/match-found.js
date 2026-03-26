document.addEventListener('DOMContentLoaded', () => {
    const waitingNotice   = document.getElementById('waitingNotice');
    const actionButtons   = document.getElementById('actionButtons');
    const toastNotification = document.getElementById('toastNotification');
    const chatNowBtn      = document.getElementById('chatNowBtn');
    const talkToAiBtn     = document.getElementById('talkToAiBtn');
    const recoveryCodeSection = document.getElementById('recoveryCodeSection');
    const recoveryCodeDisplay = document.getElementById('recoveryCodeDisplay');
    const copyCodeBtn     = document.getElementById('copyCodeBtn');

    // Récupère les données du matching depuis l'URL
    const params      = new URLSearchParams(window.location.search);
    let score       = params.get("score");
    let matchPseudo = params.get("match_pseudo");
    let matchPreview = params.get("match_preview");
    let token       = params.get("token");
    let roomId      = params.get("room_id");
    let yourPseudo  = params.get("your_pseudo");
    
    // Récupérer depuis sessionStorage si pas en URL params (fallback)
    if (!roomId) roomId = sessionStorage.getItem('halyo_room_id');
    if (!yourPseudo) yourPseudo = sessionStorage.getItem('halyo_your_pseudo');
    if (!matchPseudo) matchPseudo = sessionStorage.getItem('halyo_match_pseudo');
    if (!token) token = sessionStorage.getItem('halyo_token') || localStorage.getItem('halyo_token');
    
    console.log("Match-found.js initialization:", {
        score: score,
        matchPseudo: matchPseudo,
        roomId: roomId,
        yourPseudo: yourPseudo,
        token: token ? "present" : "missing"
    });
    
    // Récupère le code de récupération depuis localStorage ou l'URL
    let recoveryCode = localStorage.getItem('halyo_recovery_code');
    if (!recoveryCode && params.get('recovery_code')) {
        recoveryCode = params.get('recovery_code');
        localStorage.setItem('halyo_recovery_code', recoveryCode);
    }

    // Sauvegarde le token en session pour le chat
    if (token) {
        sessionStorage.setItem("halyo_token", token);
    } else {
        // Essayer de récupérer depuis localStorage ou sessionStorage
        token = sessionStorage.getItem("halyo_token") || localStorage.getItem("halyo_token");
    }
    
    // Sauvegarder aussi matchPseudo en sessionStorage pour le chat
    if (matchPseudo) {
        sessionStorage.setItem("halyo_match_pseudo", matchPseudo);
    }
    if (yourPseudo) {
        sessionStorage.setItem("halyo_your_pseudo", yourPseudo);
    }
    if (roomId) {
        sessionStorage.setItem("halyo_room_id", roomId);
    }

    // Met à jour les éléments d'affichage si ils existent dans ton HTML
    if (score        && document.getElementById("score-text"))
        document.getElementById("score-text").textContent = `Similarité : ${score} %`;
    if (matchPseudo  && document.getElementById("match-pseudo"))
        document.getElementById("match-pseudo").textContent = matchPseudo;
    if (matchPreview && document.getElementById("match-preview"))
        document.getElementById("match-preview").textContent = matchPreview;

    // Simule l'acceptation après 3-5 secondes
    const acceptDelay = 3000 + Math.random() * 2000;

    setTimeout(() => {
        waitingNotice.style.opacity   = '0';
        waitingNotice.style.transform = 'translateY(-10px)';
        waitingNotice.style.transition = 'all 0.4s ease-out';

        setTimeout(() => {
            waitingNotice.style.display = 'none';

            toastNotification.classList.add('show');

            setTimeout(() => {
                toastNotification.classList.remove('show');
            }, 4000);

            actionButtons.style.display   = 'flex';
            actionButtons.style.opacity   = '0';
            actionButtons.style.animation = 'fadeInUp 0.6s ease-out forwards';
            
            // Afficher le code de récupération
            if (recoveryCode) {
                setTimeout(() => {
                    recoveryCodeSection.style.display = 'block';
                    recoveryCodeSection.style.opacity = '0';
                    recoveryCodeSection.style.animation = 'fadeInUp 0.6s ease-out forwards';
                    recoveryCodeDisplay.textContent = recoveryCode;
                }, 300);
            }
        }, 400);
    }, acceptDelay);

    // Redirection vers le chat avec un humain
    chatNowBtn.addEventListener('click', () => {
        // Assurer que toutes les données sont en sessionStorage
        if (roomId) sessionStorage.setItem("halyo_room_id", roomId);
        if (yourPseudo) sessionStorage.setItem("halyo_your_pseudo", yourPseudo);
        if (matchPseudo) sessionStorage.setItem("halyo_match_pseudo", matchPseudo);
        if (token) sessionStorage.setItem("halyo_token", token);
        
        const chatParams = new URLSearchParams({
            room_id:      roomId,
            your_pseudo:  yourPseudo,
            match_pseudo: matchPseudo,
        });
        transitionToChat(`/chat?${chatParams}`);
    });

    // Redirection vers le chat avec l'IA
    talkToAiBtn.addEventListener('click', () => {
        localStorage.setItem('halyo_chat_type', 'ai');
        transitionToChat('chat.html');
    });

    // Fonction pour copier le code
    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(recoveryCode).then(() => {
            copyCodeBtn.textContent = 'Copié!';
            setTimeout(() => {
                copyCodeBtn.textContent = 'Copier le code';
            }, 2000);
        });
    });

    function transitionToChat(url) {
        document.body.style.opacity    = '0';
        document.body.style.transition = 'opacity 0.6s ease-out';

        setTimeout(() => {
            window.location.href = url;
        }, 600);
    }
});
