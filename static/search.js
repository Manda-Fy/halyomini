document.addEventListener('DOMContentLoaded', async () => {
    const configRes = await fetch("/config");
    const config = await configRes.json();
    const API_BASE = config.api_base;
    const form = document.getElementById('storyForm');
    const pseudoInput = document.getElementById('pseudo');
    const storyTextarea = document.getElementById('story');
    const charCount = document.querySelector('.char-count');
    const progressModal = document.getElementById('progressModal');

    // Pré-remplir si données existantes
    const savedPseudo = localStorage.getItem('halyo_pseudo');
    const savedStory  = localStorage.getItem('halyo_story');

    if (savedPseudo) pseudoInput.value = savedPseudo;
    if (savedStory) {
        storyTextarea.value = savedStory;
        updateCharCount();
    }

    storyTextarea.addEventListener('input', updateCharCount);

    function updateCharCount() {
        const count = storyTextarea.value.length;
        charCount.textContent = `${count} / 600`;

        if (count > 600) {
            storyTextarea.value = storyTextarea.value.substring(0, 600);
            charCount.textContent = '600 / 600';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pseudo = pseudoInput.value.trim();
        const story  = storyTextarea.value.trim();

        if (!pseudo || !story) {
            showNotification('Please share your story with us', 'error');
            return;
        }

        if (pseudo.length < 3) {
            showNotification('Ton pseudo doit faire au moins 3 caractères', 'error');
            return;
        }

        if (story.length < 20) {
            showNotification('Ta situation doit faire au moins 20 caractères', 'error');
            return;
        }

        localStorage.setItem('halyo_pseudo', pseudo);
        localStorage.setItem('halyo_story', story);

        progressModal.classList.add('active');

        try {
            const res = await fetch(`${API_BASE}/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pseudo: pseudo, situation: story }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Erreur serveur (${res.status})`);
            }

            const data = await res.json();

            // Sauvegarder le code de récupération
            if (data.recovery_code) {
                localStorage.setItem('halyo_recovery_code', data.recovery_code);
                localStorage.setItem('halyo_token', data.token);
                localStorage.setItem('halyo_profile_id', data.new_profile_id);
                if (data.room_id) {
                    localStorage.setItem('halyo_room_id', data.room_id);
                }
            }

            progressModal.classList.remove('active');

            const params = new URLSearchParams({
                score: data.score,
                id:    data.new_profile_id,
                token: data.token,
            });

            setTimeout(() => {
                if (data.matched) {
                    params.set("room_id",       data.room_id);
                    params.set("your_pseudo",   data.your_pseudo);
                    params.set("match_pseudo",  data.match.pseudo);
                    params.set("match_preview", data.match.situation_preview);
                    window.location.href = `/match-found?${params}`;
                } else {
                    window.location.href = `/no-match?${params}`;
                }
            }, 400);

        } catch (err) {
            progressModal.classList.remove('active');
            showNotification(err.message || "Une erreur est survenue, réessaie.", 'error');
        }
    });
});


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: rgba(255, 126, 185, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 126, 185, 0.3);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        box-shadow: 0 8px 24px rgba(255, 126, 185, 0.3);
        z-index: 10000;
        animation: slideInRight 0.4s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}
