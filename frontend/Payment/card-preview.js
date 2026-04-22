// ── Live Card Preview ────────────────────────────────────────────────────────

(function () {
    'use strict';

    // Helper: animate a card field update with a quick flash effect
    function flashUpdate(el, newText) {
        el.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-4px)';
        setTimeout(function () {
            el.textContent = newText;
            el.style.opacity = '';
            el.style.transform = '';
        }, 150);
    }

    // ── Card Number ───────────────────────────────────────────────────────────
    var cardNumberInput = document.getElementById('input-card-number');
    var cardNumberDisplay = document.getElementById('card-number-display');

    cardNumberInput.addEventListener('input', function () {
        // Strip non-digits
        var digits = this.value.replace(/\D/g, '').substring(0, 16);
        // Format into groups of 4
        var formatted = digits.replace(/(.{4})/g, '$1 ').trim();
        // Mask all but the last 4 chars
        var masked = formatted.replace(/\d(?=[ \d]{5})/g, '*');
        // Pad with placeholder stars if not full
        var groups = masked.split(' ');
        while (groups.length < 4) groups.push('****');
        cardNumberDisplay.textContent = groups.join(' ');
        // Auto-insert spaces in the input itself
        this.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });

    // ── Expiry Date ───────────────────────────────────────────────────────────
    var expiryInput = document.getElementById('input-expiry');
    var expiryDisplay = document.getElementById('card-expiry-display');

    expiryInput.addEventListener('input', function () {
        var digits = this.value.replace(/\D/g, '').substring(0, 4);
        var formatted = digits;
        if (digits.length >= 3) {
            formatted = digits.substring(0, 2) + '/' + digits.substring(2);
        }
        this.value = formatted;
        flashUpdate(expiryDisplay, formatted || 'MM/YY');
    });

    // ── CVV ───────────────────────────────────────────────────────────────────
    var cvvInput = document.getElementById('input-cvv');
    var cvvDisplay = document.getElementById('card-cvv-display');

    cvvInput.addEventListener('input', function () {
        var digits = this.value.replace(/\D/g, '').substring(0, 4);
        this.value = digits;
        flashUpdate(cvvDisplay, digits ? '•'.repeat(digits.length) : '***');
    });

    // ── Cardholder Name ───────────────────────────────────────────────────────
    var firstNameInput = document.getElementById('input-first-name');
    var lastNameInput = document.getElementById('input-last-name');
    var cardNameDisplay = document.getElementById('card-name-display');

    function updateName() {
        var first = firstNameInput.value.trim();
        var last = lastNameInput.value.trim();
        var full = [first, last].filter(Boolean).join(' ').toUpperCase();
        flashUpdate(cardNameDisplay, full || 'FULL NAME');
    }

    firstNameInput.addEventListener('input', updateName);
    lastNameInput.addEventListener('input', updateName);

})();
