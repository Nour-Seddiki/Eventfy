function goToEvent(eventId) {
    showNotification(`Loading event: ${eventId}...`);
    setTimeout(() => {
        window.location.href = `event.html?id=${eventId}`;
    }, 500);
}

function openSupport(e) {
    e.preventDefault();
    showNotification('Support chat opening...');
}

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
