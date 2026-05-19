/**
 * ═══════════════════════════════════════════
 * config.js — Eventfy Environment Configuration
 * Sets the API base URL for production / development.
 * This file MUST be loaded BEFORE api.js in every HTML page.
 * ═══════════════════════════════════════════
 */
'use strict';

// Production: point to the Render backend
// Development: falls back to localhost in api.js
window.EVENTFY_API_BASE = 'http://127.0.0.1:3000';
