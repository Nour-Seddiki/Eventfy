function selectRole(element, role) {
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('active');
    });

    element.classList.add('active');
    element.querySelector('input[type="radio"]').checked = true;
}

function handleGoogleSignUp() {
    const btn = document.querySelector('.google-btn');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<span style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #ff8c42; border-radius: 50%; animation: spin 0.8s linear infinite;"></span> Connecting...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        showNotification('Google sign-up is not yet configured for this deployment.');
        btn.innerHTML = originalHTML;
        btn.style.pointerEvents = 'auto';
    }, 1500);
}

async function handleSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('signupBtn');
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const originalText = btn.textContent;

    // Clear previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Gather form data
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    // Client-side validation
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match.';
        errorDiv.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters.';
        errorDiv.style.display = 'block';
        return;
    }

    // Show loading
    btn.innerHTML = '<span style="display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 8px;"></span> Creating account...';
    btn.disabled = true;

    try {
        await apiSignup({
            user_name: username,
            email: email,
            password: password,
            role: role,
        });

        successDiv.textContent = 'Account created successfully! Redirecting to login...';
        successDiv.style.display = 'block';
        document.getElementById('signupForm').reset();

        // Reset role selection to attendee
        document.querySelectorAll('.role-card').forEach((card, index) => {
            card.classList.toggle('active', index === 0);
        });

        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 1500);
    } catch (err) {
        errorDiv.textContent = err.message || 'Registration failed. Please try again.';
        errorDiv.style.display = 'block';
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #1e293b; color: white;
        padding: 16px 24px; border-radius: 12px;
        font-weight: 500; z-index: 10000;
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

// Add input focus effects
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });

    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Auto-redirect if already logged in
if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    window.location.href = '../dashboard/index.html';
}
