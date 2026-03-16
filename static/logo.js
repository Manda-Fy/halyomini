// Animation du tracé du cercle au chargement
document.addEventListener('DOMContentLoaded', () => {
    const ring = document.querySelector('.eclipse-ring');
    
    // Démarre l'animation de tracé
    ring.style.animation = 'drawCircle 2s ease-out forwards, pulse 2.5s ease-in-out 2s infinite';
    
    // Redirection vers home.html après 4 secondes
    setTimeout(() => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.8s ease-out';
        
        setTimeout(() => {
            window.location.href = '/home';
        }, 800);
    }, 4000);
});
