// Try Again functionality
function tryAgain(btn) {
    const icon = btn.querySelector('.refresh-icon');
    icon.classList.add('spinning');
    btn.style.opacity = '0.8';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        icon.classList.remove('spinning');
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';

        showNotification('Attempting to reconnect...');

        setTimeout(() => {
            // In real app, this would retry the failed request
            // window.location.reload();
        }, 1000);
    }, 2000);
}

// Contact Support
function showSupport(e) {
    e.preventDefault();
    showNotification('Support chat coming soon!');
}

// Notification system
function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: var(--text-dark);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 500;
        font-size: 0.9rem;
        z-index: 10000;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add subtle parallax effect to icon on mouse move
document.addEventListener('mousemove', (e) => {
    const icon = document.querySelector('.error-icon');
    const rect = icon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / 50;
    const deltaY = (e.clientY - centerY) / 50;

    icon.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
});
