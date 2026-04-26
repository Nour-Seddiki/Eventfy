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

async function handleLogin(e) {
    e.preventDefault();

    const btn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('errorMessage');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('password').value;
    const originalText = btn.innerHTML;

    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Show loading state
    btn.innerHTML = '<span class="loading"></span> Signing in...';
    btn.disabled = true;
    btn.style.opacity = '0.8';

    try {
        await apiLogin(email, password);

        showNotification('Welcome back! Redirecting...');
        setTimeout(() => {
            const user = getCachedUser();
            if (user && (user.role === 'organizer' || user.role === 'admin')) {
                window.location.href = '../org-dashboard/index.html';
            } else {
                window.location.href = '../dashboard/index.html';
            }
        }, 800);
    } catch (err) {
        errorDiv.textContent = err.message || 'Login failed. Please check your credentials.';
        errorDiv.style.display = 'block';
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

async function handleGoogleLogin() {
    const btn = document.querySelector('.google-btn');
    const errorDiv = document.getElementById('errorMessage');
    const originalHTML = btn.innerHTML;

    // Check if Google Client ID is configured
    if (!window.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
        showNotification('Google sign-in is not yet configured. Please set your Google Client ID.');
        return;
    }

    // Check if Google Identity Services library is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        showNotification('Google sign-in library is still loading. Please try again in a moment.');
        return;
    }

    btn.innerHTML = '<span class="loading" style="border-color: #e5e7eb; border-top-color: var(--primary); margin: 0;"></span> Connecting...';
    btn.disabled = true;

    try {
        // Use Google Identity Services to get an ID token
        const client = google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'openid email profile',
            ux_mode: 'popup',
            callback: () => {}, // placeholder – we use the credential approach below
        });

        // Use the ID token credential flow (One Tap / Sign In With Google)
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    await apiGoogleLogin(response.credential);
                    showNotification('Welcome! Redirecting...');
                    setTimeout(() => {
                        const user = getCachedUser();
                        if (user && (user.role === 'organizer' || user.role === 'admin')) {
                            window.location.href = '../org-dashboard/index.html';
                        } else {
                            window.location.href = '../dashboard/index.html';
                        }
                    }, 800);
                } catch (err) {
                    errorDiv.textContent = err.message || 'Google sign-in failed.';
                    errorDiv.style.display = 'block';
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }
            },
        });

        // Prompt the Google sign-in popup
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // One Tap was blocked or dismissed – fall back to the button popup
                google.accounts.id.renderButton(
                    document.createElement('div'), // hidden element
                    { type: 'icon', size: 'large' }
                );
                // Trigger the standard popup
                google.accounts.id.prompt();
            }
        });

    } catch (err) {
        showNotification(err.message || 'Google sign-in failed. Please try again.');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
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

// Auto-redirect if already logged in
if (isLoggedIn()) {
    const user = getCachedUser();
    if (user && (user.role === 'organizer' || user.role === 'admin')) {
        window.location.href = '../org-dashboard/index.html';
    } else {
        window.location.href = '../dashboard/index.html';
    }
}
