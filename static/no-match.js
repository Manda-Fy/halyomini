document.addEventListener('DOMContentLoaded', () => {
    const refineBtn = document.getElementById('refineBtn');
    const talkToAiBtn = document.getElementById('talkToAiBtn');
    const recoveryCodeSection = document.getElementById('recoveryCodeSection');
    const recoveryCodeDisplay = document.getElementById('recoveryCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    
    // Récupère le code de récupération depuis l'URL ou localStorage
    let recoveryCode = localStorage.getItem('halyo_recovery_code');
    let profileId = localStorage.getItem('halyo_profile_id');
    let yourPseudo = localStorage.getItem('halyo_pseudo');
    
    // Vérifier aussi dans les paramètres d'URL
    const params = new URLSearchParams(window.location.search);
    if (!recoveryCode && params.get('recovery_code')) {
        recoveryCode = params.get('recovery_code');
        localStorage.setItem('halyo_recovery_code', recoveryCode);
    }
    if (!profileId && params.get('id')) {
        profileId = params.get('id');
        localStorage.setItem('halyo_profile_id', profileId);
    }
    
    if (recoveryCode) {
        recoveryCodeSection.style.display = 'block';
        recoveryCodeSection.style.opacity = '0';
        recoveryCodeSection.style.animation = 'fadeInUp 0.6s ease-out forwards';
        recoveryCodeDisplay.textContent = recoveryCode;
    }
    
    // Fonction pour copier le code
    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(recoveryCode).then(() => {
            copyCodeBtn.textContent = 'Copié!';
            setTimeout(() => {
                copyCodeBtn.textContent = 'Copier le code';
            }, 2000);
        });
    });
    
    // Retour à la page de recherche avec données pré-remplies
    refineBtn.addEventListener('click', () => {
        // Les données sont déjà dans localStorage
        transitionTo('/search');
    });
    
    // Redirection vers le chat avec l'IA
    talkToAiBtn.addEventListener('click', () => {
        localStorage.setItem('halyo_chat_type', 'ai');
        transitionTo('chat.html');
    });
    
    // ============================================
    // Polling pour vérifier si un match a été trouvé
    // ============================================
    async function checkForMatch() {
        if (!profileId) return;
        
        try {
            const response = await fetch('/check-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile_id: parseInt(profileId) })
            });
            
            const data = await response.json();
            
            if (data.matched && data.room_id) {
                // Un match a été trouvé !
                console.log('Match trouvé ! Redirection vers le chat...');
                
                // Sauvegarder le token et les infos
                if (data.token) {
                    localStorage.setItem('halyo_token', data.token);
                    sessionStorage.setItem('halyo_token', data.token);
                }
                if (data.room_id) {
                    localStorage.setItem('halyo_room_id', data.room_id);
                }
                
                showMatchNotification(data);
                return true;
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du match:', error);
        }
        return false;
    }
    
    // Afficher une notification et rediriger vers le chat
    function showMatchNotification(matchData) {
        // Créer une notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 2rem 3rem;
            color: white;
            font-family: 'Inter', sans-serif;
            text-align: center;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.5);
            z-index: 10000;
        `;
        notification.style.animation = 'fadeInUp 0.5s ease-out';
        notification.innerHTML = `
            <h2 style="margin: 0 0 1rem 0; font-size: 1.8rem;">🎉 Résonance trouvée !</h2>
            <p style="margin: 0 0 1.5rem 0; font-size: 1.1rem;">
                Quelqu'un partage une histoire similaire à la tienne.<br>
                <strong>@{matchData.match.pseudo}</strong> t'attend pour discuter.
            </p>
            <button id="goToChatBtn" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 1rem 2rem;
                border-radius: 30px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            ">Commencer à discuter</button>
        `;
        
        document.body.appendChild(notification);
        
        // Ajouter l'événement au bouton
        document.getElementById('goToChatBtn').addEventListener('click', () => {
            // Stocker les données en sessionStorage plutôt que en URL
            sessionStorage.setItem('halyo_room_id', matchData.room_id);
            sessionStorage.setItem('halyo_your_pseudo', matchData.your_pseudo);
            sessionStorage.setItem('halyo_match_pseudo', matchData.match.pseudo);
            sessionStorage.setItem('halyo_token', matchData.token);
            
            const chatParams = new URLSearchParams({
                room_id: matchData.room_id,
                your_pseudo: matchData.your_pseudo,
                match_pseudo: matchData.match.pseudo
            });
            window.location.href = `/match-found?${chatParams}`;
        });
        
        // Redirection automatique après 5 secondes
        setTimeout(() => {
            // Stocker les données en sessionStorage
            sessionStorage.setItem('halyo_room_id', matchData.room_id);
            sessionStorage.setItem('halyo_your_pseudo', matchData.your_pseudo);
            sessionStorage.setItem('halyo_match_pseudo', matchData.match.pseudo);
            sessionStorage.setItem('halyo_token', matchData.token);
            
            const chatParams = new URLSearchParams({
                room_id: matchData.room_id,
                your_pseudo: matchData.your_pseudo,
                match_pseudo: matchData.match.pseudo
            });
            window.location.href = `/match-found?${chatParams}`;
        }, 5000);
    }
    
    // Démarrer le polling toutes les 3 secondes
    if (profileId) {
        console.log('Démarrage du polling pour profile_id:', profileId);
        
        // Vérifier immédiatement
        checkForMatch();
        
        // Puis vérifier toutes les 3 secondes
        setInterval(async () => {
            const found = await checkForMatch();
            // Si un match est trouvé, le polling s'arrêtera automatiquement
        }, 3000);
    }
    
    function transitionTo(url) {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease-out';
        
        setTimeout(() => {
            window.location.href = url;
        }, 600);
    }
});
