const fs = require('fs');

const files = [
    'c:/Users/DELL/eventfy-ui/my-dashboard/index.html',
    'c:/Users/DELL/eventfy-ui/organizer-dashboard/index.html',
    'c:/Users/DELL/eventfy-ui/organizer-profile/index.html'
];

let desktopNav = `    <nav class="header-nav" aria-label="Main navigation">
      <a href="#" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Home
      </a>
      <a href="#" class="nav-link active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        Browse
      </a>
      <a href="#" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        About
      </a>
      <a href="#" class="nav-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        How it Works
      </a>`;

let activeProfile = `      <a href="../organizer-profile/index.html" class="drawer-link{ACTIVE_PROFILE}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Profile Settings
      </a>`;

let activeMyEvents = `      <a href="../organizer-dashboard/index.html" class="drawer-link{ACTIVE_MYEVENTS}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        My Events
      </a>`;

let activeSavedEvents = `      <a href="../my-dashboard/index.html" class="drawer-link{ACTIVE_SAVEDEVENTS}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        Saved Events
      </a>`;

let drawerNavTemplate = `    <div class="drawer-nav">
      <a href="#" class="drawer-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Home
      </a>
      <a href="#" class="drawer-link active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        Browse
      </a>
      <a href="#" class="drawer-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        About
      </a>
      <a href="#" class="drawer-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        How it Works
      </a>
{PROFILE_LINK}
{MYEVENTS_LINK}
{SAVEDEVENTS_LINK}
    </div>
    <div class="drawer-bottom-menu">
      <div class="drawer-notif">
        <div class="drawer-notif-left">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
          Notifications
        </div>
        <span class="drawer-notif-dot"></span>
      </div>
      <button class="btn-drawer-logout btn-do-logout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Log out
      </button>
    </div>`;

files.forEach(f => {
    let html = fs.readFileSync(f, 'utf8');
    
    // desktop nav pattern
    html = html.replace(/<nav class="header-nav" aria-label="Main navigation">[\s\S]*?<a href="#" class="nav-link.*?">How it Works<\/a>/g, desktopNav);
    
    // determine active link
    let profActive = html.includes('class="drawer-link active">Profile</a>') ? ' active' : '';
    let eventsActive = html.includes('class="drawer-link active">My Events</a>') ? ' active' : '';
    let savedActive = f.includes('my-dashboard') ? ' active' : ''; 

    let repStr = drawerNavTemplate
        .replace('{PROFILE_LINK}', activeProfile.replace('{ACTIVE_PROFILE}', profActive))
        .replace('{MYEVENTS_LINK}', activeMyEvents.replace('{ACTIVE_MYEVENTS}', eventsActive))
        .replace('{SAVEDEVENTS_LINK}', activeSavedEvents.replace('{ACTIVE_SAVEDEVENTS}', savedActive));
    
    html = html.replace(/<div class="drawer-nav">[\s\S]*?<\/nav>/, repStr + '\n  </div>\n</nav>');
    
    // change user data
    html = html.replace(/window\.EVENTFY_USER\s*=\s*\{.*?\};/, "window.EVENTFY_USER = { name: 'Yacine Salhi', initials: 'YS', role: 'Member' };");
    html = html.replace(/Alex Rivers/g, 'Yacine Salhi');
    html = html.replace(/>AR</g, '>YS<');
    html = html.replace(/'AR'/g, "'YS'");
    html = html.replace(/>Organizer<\/div>/g, '>Member</div>');
    html = html.replace(/>Attendee<\/div>/g, '>Member</div>');
    
    fs.writeFileSync(f, html);
});
console.log('Successfully completed html replacement!');
