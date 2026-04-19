"""
Mock Data Generation Script for Eventfy
Uses the correct API endpoints.
"""
import requests
import random
from datetime import datetime, timedelta

BASE = "http://localhost:8000"

# -- 1. Create Users --
users_data = [
    {"user_name": "yacine_salhi",  "email": "yacine.salhi@gmail.com",  "password": "Pass123!", "role": "organizer"},
    {"user_name": "amira_benali",  "email": "amira.benali@gmail.com",   "password": "Pass123!", "role": "organizer"},
    {"user_name": "karim_hadj",    "email": "karim@gmail.com",    "password": "Pass123!", "role": "attendee"},
    {"user_name": "nour_seddiki",  "email": "nour@gmail.com",     "password": "Pass123!", "role": "attendee"},
    {"user_name": "lina_meziane",  "email": "lina@gmail.com",     "password": "Pass123!", "role": "attendee"},
]

tokens = {}

print("=== Creating Users ===")
for u in users_data:
    resp = requests.post(f"{BASE}/auth/sign_up", json=u)
    if resp.status_code in (200, 201):
        print(f"  [OK] Created user: {u['user_name']}")
    else:
        print(f"  [WARN] User {u['user_name']}: {resp.status_code} - {resp.text[:100]}")

    # Login uses OAuth2 form data (username field = email)
    login_resp = requests.post(f"{BASE}/auth/token", data={"username": u["email"], "password": u["password"]})
    if login_resp.status_code == 200:
        token = login_resp.json().get("access_token")
        tokens[u["user_name"]] = token
        print(f"    -> Token acquired for {u['user_name']}")
    else:
        print(f"    [FAIL] Login for {u['user_name']}: {login_resp.text[:100]}")


# -- 2. Create Events --
events_data = [
    {
        "title": "Algiers Jazz Nights",
        "description": "An immersive evening of jazz fusion in the heart of the historic Casbah. Featuring local and international musicians blending Andalusian melodies with modern jazz.",
        "category": "Music",
        "location": "Palais des Rais, Algiers",
        "price": 3500.0,
        "available_tickets": 200,
        "date": (datetime.now() + timedelta(days=60)).isoformat(),
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCuhizBKUSsUNbSLsZIH238FuvfmyTxnZ4PX4DV6ME8OmZtiSDUpDAsdM8YaSK6zdfh33zQLBtFsBGVALvTl0bs95NoYrO7IthX9cKLlNLwxiLsZTXsJ0Q6WX9tyFvMAthByiTqYQpyj2EvFsxRmdPfi-5M6KihGDpk4KLOAOdu4u5wDZg4ENeyx7jZPYVt7QlGk7WNKZVtaN4-0IpXgBcGvY5BKx9Z8VYyZSl5O6qoAOyFhCuB9QtRH8grd_FbTJ1QxMoidndPvseo"
    },
    {
        "title": "Oran Digital Summit",
        "description": "A two-day conference bringing together tech entrepreneurs, developers, and investors. Keynotes, AI/ML workshops, and a live hackathon with prizes.",
        "category": "Science & Tech",
        "location": "Meridien Hotel, Oran",
        "price": 0.0,
        "available_tickets": 500,
        "date": (datetime.now() + timedelta(days=90)).isoformat(),
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuAddhZL64AxnroIzH7H5sCwXwIU8cCgOR5v8ZOep6gvvf3mNn9880aizP7V9ZxmxaXLcN858ljJ72gFMxwuuy-ZOkigSM9k5QQ_wrRIOMxqBR1d0wzppPix2lM4vN9m1Cxm8OWrxPFEk5mOYYdHqXujvNfiMhuD4WhQ-2sOzwer9Z8BACc7q-TwgwUX9HmdQ297exU6l5R5AdgIBtU-4HfJKw8iae9iaxGyArQ-1T4hbQRMhhBw0uGFgh69JYpIZ2p8s40uKpvaWVcg"
    },
    {
        "title": "Mediterranean Art Expo",
        "description": "Showcase of contemporary art from across the Mediterranean, featuring installations, paintings, and digital art from emerging and established artists.",
        "category": "Art",
        "location": "MAMA Museum, Algiers",
        "price": 1200.0,
        "available_tickets": 300,
        "date": (datetime.now() + timedelta(days=120)).isoformat(),
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBOdNjZIf146if2Xo8BrdpFAMgpkjCYnmGvYSgxFrOJSBHGBBQDp_bYQkV3kt6ZZhosfcwSb1UXj0Wy5Mq3NwA91MFQigsn4FdketHaCFIJ03p9np78vAlj2jCxN4XE1S2_wkC-LC_Xc1diuEHt1LZahgDt5v4V5A3qFnGUNt2Nwn41YR3miFhepsnNQDvl7l_jU53hMvdjSbiW8mGH_o3JlLz5Wu-bblZVgN_8K-oWZWPJoBCSSOCPjD4xkNADT-qa74fGvnCJW-pZ"
    },
    {
        "title": "Sunset Beats Oran",
        "description": "Watch the sun set over the Mediterranean while DJs spin Rai-electronic fusion from a rooftop venue. Food trucks and craft cocktails.",
        "category": "Music",
        "location": "Sky Lounge, Oran",
        "price": 2000.0,
        "available_tickets": 150,
        "date": (datetime.now() + timedelta(days=70)).isoformat(),
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuB9PGNN_TzrK4fKDlpO4UkwSq3LAcufJMjDYYFhcC3TL1YN33elDJITwMpjQTZZ8pbN_kNL3WyR4aQogqTVw6V9LfUIWKmfGJ2TK_O-ckLtaA5BDnfOlK3QW4INho8B43snAKf9NDJaMHowtVhmoY5LNNBv5Qo0CoO7bSHt3WrOTsJklvy9d3vqn_G1FYlSyFWiCfSy-lNtVBE0QSYbbB1ARtWTrLwHaL61JtE9t8v5rTcc4RkdCbSyEUX_vaIjNCsFXyDFt0-Rq_h8"
    },
    {
        "title": "Heritage Walk Constantine",
        "description": "Discover the Bridges City with a guided walking tour through ancient medina, across suspended bridges, and into Ottoman-era palaces.",
        "category": "Cultural",
        "location": "Place de la Breche, Constantine",
        "price": 800.0,
        "available_tickets": 40,
        "date": (datetime.now() + timedelta(days=30)).isoformat(),
        "image": "https://images.unsplash.com/photo-1572953109213-3be62398eb95?w=600&h=400&fit=crop"
    },
    {
        "title": "Startup Weekend 2026",
        "description": "54-hour weekend event: pitch ideas, form teams, build prototypes. Mentored by founders, judged by VCs. Top 3 win seed funding.",
        "category": "Business",
        "location": "The Business Center, Algiers",
        "price": 5000.0,
        "available_tickets": 100,
        "date": (datetime.now() + timedelta(days=45)).isoformat(),
        "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop"
    },
    {
        "title": "Sahara Stargazing Night",
        "description": "Journey into the Sahara for a night under pristine dark skies. Telescope sessions, astrophotography workshops, Tuareg campfire dinner.",
        "category": "Science & Tech",
        "location": "Tassili Oasis, Tamanrasset",
        "price": 8000.0,
        "available_tickets": 30,
        "date": (datetime.now() + timedelta(days=80)).isoformat(),
        "image": "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop"
    },
    {
        "title": "Kabylie Food Festival",
        "description": "Celebrate Kabylie culinary traditions with cooking demos, tasting sessions, and competitions. From couscous to traditional sweets.",
        "category": "Food & Drink",
        "location": "Tizi Ouzou Cultural Center",
        "price": 1500.0,
        "available_tickets": 250,
        "date": (datetime.now() + timedelta(days=55)).isoformat(),
        "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop"
    },
    {
        "title": "Photo Marathon Algiers",
        "description": "12-hour photo challenge across Algiers. Themed prompts every 2 hours, compete to capture the city soul. Exhibition and awards.",
        "category": "Art",
        "location": "Place Maurice Audin, Algiers",
        "price": 2500.0,
        "available_tickets": 75,
        "date": (datetime.now() + timedelta(days=35)).isoformat(),
        "image": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop"
    },
    {
        "title": "E-Sports Algiers Open",
        "description": "North Africa biggest gaming tournament! LoL, Valorant, FIFA 26. LAN party, cosplay contest, retro arcade, 50M DZD prizes.",
        "category": "Gaming",
        "location": "CIC Convention Center, Algiers",
        "price": 3000.0,
        "available_tickets": 400,
        "date": (datetime.now() + timedelta(days=100)).isoformat(),
        "image": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop"
    },
]

print("\n=== Creating Events ===")
for i, ev in enumerate(events_data):
    # Alternate between two organizers
    if i % 2 == 1 and tokens.get("amira_benali"):
        headers = {"Authorization": f"Bearer {tokens['amira_benali']}"}
    elif tokens.get("yacine_salhi"):
        headers = {"Authorization": f"Bearer {tokens['yacine_salhi']}"}
    else:
        print("  [FAIL] No organizer token available!")
        break

    resp = requests.post(f"{BASE}/Event/create_event", json=ev, headers=headers)
    if resp.status_code in (200, 201):
        print(f"  [OK] Created event: {ev['title']}")
    else:
        print(f"  [WARN] Event '{ev['title']}': {resp.status_code} - {resp.text[:120]}")


# -- 3. Get events then create Tickets & Saved Events --
print("\n=== Getting event list ===")
events_resp = requests.get(f"{BASE}/events/public")
events_list = []
if events_resp.status_code == 200:
    events_list = events_resp.json()
    print(f"  -> Found {len(events_list)} events")
else:
    print(f"  [FAIL] Get events: {events_resp.status_code}")

attendees = ["karim_hadj", "nour_seddiki", "lina_meziane"]

if events_list:
    # Each attendee buys tickets to 3-4 random events
    print("\n=== Creating Tickets (Registrations) ===")
    for attendee in attendees:
        token = tokens.get(attendee)
        if not token:
            continue
        headers = {"Authorization": f"Bearer {token}"}
        sample = random.sample(events_list, min(4, len(events_list)))
        for ev in sample:
            resp = requests.post(f"{BASE}/ticket/purchase_ticket/{ev['id']}", headers=headers)
            if resp.status_code in (200, 201):
                print(f"  [OK] {attendee} -> ticket for '{ev.get('title', ev['id'])}'")
            else:
                print(f"  [WARN] {attendee} ticket: {resp.status_code} - {resp.text[:80]}")

    # Each attendee saves 2-3 events
    print("\n=== Saving Events ===")
    for attendee in attendees:
        token = tokens.get(attendee)
        if not token:
            continue
        headers = {"Authorization": f"Bearer {token}"}
        sample = random.sample(events_list, min(3, len(events_list)))
        for ev in sample:
            resp = requests.post(f"{BASE}/saving-events/save", json={"event_id": ev["id"]}, headers=headers)
            if resp.status_code in (200, 201):
                print(f"  [OK] {attendee} saved '{ev.get('title', ev['id'])}'")
            else:
                print(f"  [WARN] {attendee} save: {resp.status_code} - {resp.text[:80]}")

print("\n=== Done! ===")
print(f"\nTest Credentials:")
print(f"  Organizer: yacine.salhi@gmail.com / Pass123!")
print(f"  Organizer: amira.benali@gmail.com / Pass123!")
print(f"  Attendee:  nour@gmail.com    / Pass123!")
print(f"  Attendee:  karim@gmail.com   / Pass123!")
print(f"  Attendee:  lina@gmail.com    / Pass123!")
