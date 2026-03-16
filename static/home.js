document.addEventListener('DOMContentLoaded', () => {
    const beginButton = document.getElementById('beginJourney');
    
    beginButton.addEventListener('click', () => {
        // Effet de transition
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.6s ease-out';
        
        setTimeout(() => {
            window.location.href = '/search';
        }, 600);
    });
});
