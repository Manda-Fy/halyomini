document.addEventListener('DOMContentLoaded', () => {
    const waitingNotice   = document.getElementById('waitingNotice');
    const actionButtons   = document.getElementById('actionButtons');
    const toastNotification = document.getElementById('toastNotification');
    const chatNowBtn      = document.getElementById('chatNowBtn');
    const talkToAiBtn     = document.getElementById('talkToAiBtn');

    // Récupère les données du matching depuis l'URL
    const params      = new URLSearchParams(window.location.search);
    const score       = params.get("score");
    const matchPseudo = params.get("match_pseudo");
    const matchPreview = params.get("match_preview");
    const token       = params.get("token");
    const roomId      = params.get("room_id");
    const yourPseudo  = params.get("your_pseudo");

    // Sauvegarde le token en session pour le chat
    if (token) sessionStorage.setItem("halyo_token", token);

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
        }, 400);
    }, acceptDelay);

    // Redirection vers le chat avec un humain
    chatNowBtn.addEventListener('click', () => {
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

    function transitionToChat(url) {
        document.body.style.opacity    = '0';
        document.body.style.transition = 'opacity 0.6s ease-out';

        setTimeout(() => {
            window.location.href = url;
        }, 600);
    }
});
