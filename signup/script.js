function selectRole(element, role) {
    document.querySelectorAll('.role-card').forEach(card => {
        card.classList.remove('active');
    });

    element.classList.add('active');
    element.querySelector('input[type="radio"]').checked = true;

    console.log('Selected role:', role);
}

function handleGoogleSignUp() {
    const btn = document.querySelector('.google-btn');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<span style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top-color: #ff8c42; border-radius: 50%; animation: spin 0.8s linear infinite;"></span> Connecting...';
    btn.style.pointerEvents = 'none';

    setTimeout(() => {
        alert('Google Sign Up initiated!');
        btn.innerHTML = originalHTML;
        btn.style.pointerEvents = 'auto';
    }, 1500);
}

function handleSubmit(e) {
    e.preventDefault();

    const btn = document.querySelector('.submit-btn');
    const originalText = btn.textContent;

    btn.innerHTML = '<span style="display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 8px;"></span> Creating account...';
    btn.disabled = true;

    setTimeout(() => {
        alert('Account created successfully! Welcome to Eventify.');
        btn.textContent = originalText;
        btn.disabled = false;
        document.getElementById('signupForm').reset();

        // Reset role selection to visitor
        document.querySelectorAll('.role-card').forEach((card, index) => {
            card.classList.toggle('active', index === 0);
        });
    }, 2000);
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
