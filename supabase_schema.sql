-- ═══════════════════════════════════════════════════════
-- Eventfy — Supabase PostgreSQL Schema
-- Generated from SQLAlchemy models
-- Run this in the Supabase SQL Editor (supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'attendee',
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    profile_picture VARCHAR,
    bio TEXT,
    linkedin VARCHAR,
    twitter VARCHAR,
    instagram VARCHAR,
    phone VARCHAR,
    address VARCHAR,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_users_id ON users(id);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);


-- 2. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    location VARCHAR,
    price FLOAT DEFAULT 0.0,
    date TIMESTAMP,
    available_tickets INTEGER DEFAULT 0,
    image VARCHAR,
    organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_events_id ON events(id);
CREATE INDEX IF NOT EXISTS ix_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS ix_events_category ON events(category);


-- 3. TICKETS
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'confirmed',
    qr_code VARCHAR,
    is_validated BOOLEAN DEFAULT FALSE,
    price_paid FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_tickets_id ON tickets(id);
CREATE INDEX IF NOT EXISTS ix_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS ix_tickets_event_id ON tickets(event_id);


-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR DEFAULT 'DZD',
    payment_method VARCHAR,
    status VARCHAR DEFAULT 'pending',
    checkout_id VARCHAR,
    checkout_url VARCHAR,
    provider_ref VARCHAR,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_payments_id ON payments(id);
CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id);


-- 5. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR,
    title VARCHAR,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    related_object_id VARCHAR,
    related_object_type VARCHAR,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications(id);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id);


-- 6. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    rating INTEGER NOT NULL,
    comment TEXT,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_reviews_id ON reviews(id);


-- 7. SAVING EVENTS (bookmarks)
CREATE TABLE IF NOT EXISTS saving_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_saving_events_id ON saving_events(id);


-- 8. RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    score INTEGER,
    generated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS ix_recommendations_id ON recommendations(id);


-- ═══════════════════════════════════════
-- Done! All 8 tables created.
-- ═══════════════════════════════════════
