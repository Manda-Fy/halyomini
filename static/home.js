document.addEventListener('DOMContentLoaded', async () => {
    const beginButton = document.getElementById('beginJourney');
    const recoverBtn = document.getElementById('recoverBtn');
    const recoverModal = document.getElementById('recoverModal');
    const closeRecoverBtn = document.getElementById('closeRecoverBtn');
    const recoverForm = document.getElementById('recoverForm');
    const recoveryCodeInput = document.getElementById('recoveryCodeInput');
    const recoverError = document.getElementById('recoverError');

    // Récupérer la config de l'API
    let API_BASE = '';
    try {
        const configRes = await fetch("/config");
        const config = await configRes.json();
        API_BASE = config.api_base;
    } catch (e) {
        console.error("Erreur config:", e);
    }

    beginButton.addEventListener('click', () => {
        // Effet de transition
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease-out';
        
        setTimeout(() => {
            window.location.href = '/search';
        }, 600);
    });

    // Ouvrir le modal de récupération
    recoverBtn.addEventListener('click', () => {
        recoverModal.classList.add('active');
        recoveryCodeInput.focus();
    });

    // Fermer le modal
    closeRecoverBtn.addEventListener('click', () => {
        recoverModal.classList.remove('active');
        recoverError.textContent = '';
        recoveryCodeInput.value = '';
    });

    // Fermer en cliquant en dehors
    recoverModal.addEventListener('click', (e) => {
        if (e.target === recoverModal) {
            recoverModal.classList.remove('active');
            recoverError.textContent = '';
            recoveryCodeInput.value = '';
        }
    });

    // Soumettre le formulaire de récupération
    recoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = recoveryCodeInput.value.trim().toUpperCase();
        
        if (!code || code.length !== 8) {
            recoverError.textContent = 'Le code doit contenir 8 caractères';
            return;
        }

        recoverError.textContent = 'Recherche en cours...';

        try {
            const res = await fetch(`${API_BASE}/recover`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recovery_code: code }),
            });

            const data = await res.json();

            if (!res.ok) {
                recoverError.textContent = data.error || 'Erreur lors de la récupération';
                return;
            }

            // Sauvegarder les données
            localStorage.setItem('halyo_recovery_code', code);
            localStorage.setItem('halyo_token', data.token);
            localStorage.setItem('halyo_profile_id', data.new_profile_id);
            localStorage.setItem('halyo_pseudo', data.your_pseudo);
            
            if (data.room_id) {
                localStorage.setItem('halyo_room_id', data.room_id);
            }

            // Rediriger vers la page appropriée
            if (data.matched) {
                const params = new URLSearchParams({
                    score: data.score,
                    id: data.new_profile_id,
                    token: data.token,
                    room_id: data.room_id,
                    your_pseudo: data.your_pseudo,
                    match_pseudo: data.match.pseudo,
                    match_preview: data.match.situation_preview,
                });
                window.location.href = `/match-found?${params}`;
            } else {
                // Pas encore de match
                const params = new URLSearchParams({
                    score: data.score || 0,
                    id: data.new_profile_id,
                    token: data.token,
                });
                window.location.href = `/no-match?${params}`;
            }

        } catch (err) {
            recoverError.textContent = 'Erreur de connexion, réessaie';
            console.error(err);
        }
    });

    // Auto-uppercase le code
    recoveryCodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
});
