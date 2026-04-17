function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

function handleLogin(e) {
    e.preventDefault();

    const btn = document.getElementById('loginBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<span class="loading"></span> Signing in...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';

        showNotification('Welcome back! Redirecting...');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 2000);
}

function handleGoogleLogin() {
    const btn = document.querySelector('.google-btn');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<span class="loading" style="border-color: #e5e7eb; border-top-color: var(--primary); margin: 0;"></span> Connecting...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        showNotification('Google sign in initiated!');
    }, 1500);
}

function showForgot(e) {
    e.preventDefault();
    showNotification('Password reset link sent to your email!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--text-dark);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
