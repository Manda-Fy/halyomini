document.addEventListener('DOMContentLoaded', () => {
    const refineBtn = document.getElementById('refineBtn');
    const talkToAiBtn = document.getElementById('talkToAiBtn');
    
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
    
    function transitionTo(url) {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease-out';
        
        setTimeout(() => {
            window.location.href = url;
        }, 600);
    }
});
