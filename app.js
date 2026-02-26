// ═══════════════════════════════════════════════════════════════
// YOUBIIIZ — app.js
// Architecture : fonctions indépendantes, pas de scope imbriqué
// ═══════════════════════════════════════════════════════════════

// ── Config Firebase ──
var FB_CONFIG = {
  apiKey: "AIzaSyDOSIhWwrlkhNfk8Y3-tl9IebJW0YBA7d4",
  authDomain: "youbiiiz-app.firebaseapp.com",
  projectId: "youbiiiz-app",
  storageBucket: "youbiiiz-app.firebasestorage.app",
  messagingSenderId: "664733497216",
  appId: "1:664733497216:web:ae19fbadf0fa509f59b365"
};

// ── État global ──
var auth, db;
var me = null;
var items = [];
var curItem = null;
var scanData = null;
var camStream = null;
var carIdx = 0;
var mapObj = null;
var mapMarkers = [];
var userLat = null, userLng = null;
var detMap = null;
var favorites = new Set();
var activeCat = 'all';
var videoFile = null;
var mainPhotoData = null;
var extraPhotos = [];

// ── Données de démo ──
var DEMO_ITEMS = [
  {
    id:'d1', userId:'demo1', itemName:'iPhone 14 Pro 256Go Noir', price:699,
    category:'Téléphones & objets connectés', condition:'Très bon état',
    description:'iPhone 14 Pro 256Go Noir Spatial. Batterie 91%, aucune rayure. Vendu avec chargeur MagSafe et coque.',
    brand:'Apple', model:'iPhone 14 Pro', city:'Paris', lat:48.8566, lng:2.3522,
    imageUrl:'https://picsum.photos/seed/iphone14p/600/600',
    videoUrl:'https://www.w3schools.com/html/mov_bbb.mp4',
    shipping:[{method:'Main propre',price:0},{method:'Colissimo',price:8}],
    createdAt:{seconds:Date.now()/1000-100}, views:42
  },
  {
    id:'d2', userId:'demo2', itemName:'PlayStation 5 + 2 manettes', price:420,
    category:'Consoles', condition:'Bon état',
    description:'PS5 édition disc avec 2 manettes DualSense. Peu utilisée, parfait état. Câbles et boîte inclus.',
    brand:'Sony', model:'PS5', city:'Lyon', lat:45.764, lng:4.835,
    imageUrl:'https://picsum.photos/seed/ps5demo/600/600',
    shipping:[{method:'Main propre',price:0},{method:'Mondial Relay',price:12}],
    createdAt:{seconds:Date.now()/1000-200}, views:89
  },
  {
    id:'d3', userId:'demo3', itemName:'MacBook Air M2 13 pouces', price:950,
    category:'Ordinateurs', condition:'Neuf',
    description:'MacBook Air M2 2022, 8Go RAM, 256Go SSD. Jamais ouvert, offert en cadeau. Facture disponible.',
    brand:'Apple', model:'MacBook Air M2', city:'Bordeaux', lat:44.837, lng:-0.579,
    imageUrl:'https://picsum.photos/seed/macbookm2/600/600',
    videoUrl:'https://www.w3schools.com/html/movie.mp4',
    shipping:[{method:'Colissimo',price:15}],
    createdAt:{seconds:Date.now()/1000-300}, views:167
  },
  {
    id:'d4', userId:'demo4', itemName:'Vélo électrique Decathlon', price:680,
    category:'Vélos', condition:'Bon état',
    description:'Vélo électrique autonomie 60km, frein à disque. 2 saisons, pneus neufs.',
    brand:'Decathlon', model:'E-ST500', city:'Marseille', lat:43.296, lng:5.369,
    imageUrl:'https://picsum.photos/seed/veloelec/600/600',
    shipping:[{method:'Main propre',price:0}],
    createdAt:{seconds:Date.now()/1000-400}, views:34
  },
  {
    id:'d5', userId:'demo5', itemName:'Nike Air Jordan 1 Retro T42', price:185,
    category:'Chaussures homme', condition:'Très bon état',
    description:'Jordan 1 Retro High OG Chicago 2022, T42. Portées 3 fois, boîte et lacets originaux.',
    brand:'Nike', model:'Air Jordan 1', city:'Toulouse', lat:43.604, lng:1.444,
    imageUrl:'https://picsum.photos/seed/jordan1/600/600',
    videoUrl:'https://www.w3schools.com/html/mov_bbb.mp4',
    shipping:[{method:'Mondial Relay',price:5}],
    createdAt:{seconds:Date.now()/1000-500}, views:78
  },
  {
    id:'d6', userId:'demo6', itemName:'Canapé angle convertible gris', price:350,
    category:'Ameublement', condition:'Bon état',
    description:'Canapé d\'angle convertible, tissu gris anthracite avec coffre de rangement.',
    brand:'IKEA', model:'Friheten', city:'Nantes', lat:47.218, lng:-1.553,
    imageUrl:'https://picsum.photos/seed/canape/600/600',
    shipping:[{method:'Main propre',price:0}],
    createdAt:{seconds:Date.now()/1000-600}, views:55
  },
  {
    id:'d7', userId:'demo7', itemName:'Guitare acoustique Yamaha F310', price:90,
    category:'Instruments de musique', condition:'Bon état',
    description:'Yamaha F310 taille 4/4, idéale pour débuter. Vendue avec housse et capodastre.',
    brand:'Yamaha', model:'F310', city:'Strasbourg', lat:48.573, lng:7.752,
    imageUrl:'https://picsum.photos/seed/guitare/600/600',
    shipping:[{method:'Main propre',price:0},{method:'Colissimo',price:12}],
    createdAt:{seconds:Date.now()/1000-700}, views:23
  },
  {
    id:'d8', userId:'demo8', itemName:'Dyson V11 Aspirateur balai', price:290,
    category:'Électroménager', condition:'Très bon état',
    description:'Dyson V11 Absolute Pro, batterie neuve. Livré avec toutes les têtes et support mural.',
    brand:'Dyson', model:'V11', city:'Lille', lat:50.629, lng:3.057,
    imageUrl:'https://picsum.photos/seed/dysonv11/600/600',
    shipping:[{method:'Colissimo',price:18}],
    createdAt:{seconds:Date.now()/1000-800}, views:91
  },
  {
    id:'d9', userId:'demo9', itemName:'Rolex Datejust 36mm Cadran Vert', price:6800,
    category:'Montres & Bijoux', condition:'Très bon état',
    description:'Rolex Datejust 36mm, lunette flutée or jaune, cadran vert. Année 2019, boîte et papiers.',
    brand:'Rolex', model:'Datejust 36', city:'Paris', lat:48.873, lng:2.295,
    imageUrl:'https://picsum.photos/seed/rolex/600/600',
    shipping:[{method:'Main propre',price:0}],
    createdAt:{seconds:Date.now()/1000-900}, views:203
  },
  {
    id:'d10', userId:'demo10', itemName:'Lego Millennium Falcon 75192', price:480,
    category:'Jeux & Jouets', condition:'Neuf',
    description:'Lego 75192, 7541 pièces, boîte scellée jamais ouverte. Facture disponible.',
    brand:'Lego', model:'75192', city:'Nice', lat:43.710, lng:7.262,
    imageUrl:'https://picsum.photos/seed/lego75192/600/600',
    shipping:[{method:'Colissimo',price:20}],
    createdAt:{seconds:Date.now()/1000-1000}, views:312
  }
];

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

function initFirebase() {
  if (typeof firebase === 'undefined') {
    setTimeout(initFirebase, 100);
    return;
  }
  try {
    firebase.app();
  } catch(e) {
    firebase.initializeApp(FB_CONFIG);
  }
  auth = firebase.auth();
  db   = firebase.firestore();

  // Charger les favoris
  var saved = localStorage.getItem('yb_favs');
  if (saved) {
    try { favorites = new Set(JSON.parse(saved)); } catch(e) {}
  }

  auth.onAuthStateChanged(function(u) {
    if (u && !me) {
      me = u;
      boot();
    }
  });
}

function boot() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  loadItems();
  updateProfileUI();
}

function loadItems() {
  items = DEMO_ITEMS.slice();
  if (!db || !me || me.isVisitor) {
    renderFeed();
    renderShorts();
    return;
  }
  db.collection('scans').orderBy('createdAt','desc').limit(50).get()
    .then(function(snap) {
      snap.forEach(function(doc) {
        var d = doc.data();
        d.id = doc.id;
        items.unshift(d);
      });
      renderFeed();
      renderShorts();
    })
    .catch(function() {
      renderFeed();
      renderShorts();
    });
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

window.showTab = function(tab) {
  document.getElementById('panel-login').style.display   = tab === 'login' ? 'block' : 'none';
  document.getElementById('panel-register').style.display = tab === 'register' ? 'block' : 'none';
  var tl = document.getElementById('tab-login');
  var tr = document.getElementById('tab-register');
  tl.classList.toggle('active', tab === 'login');
  tr.classList.toggle('active', tab === 'register');
};

window.doLogin = function() {
  var email = (document.getElementById('login-email') || {}).value || '';
  var pass  = (document.getElementById('login-pass') || {}).value || '';
  email = email.trim();
  if (!email || !pass) { showAuthError('Remplissez email et mot de passe'); return; }
  if (!auth) { showAuthError('Chargement en cours, réessayez...'); setTimeout(window.doLogin, 800); return; }
  auth.signInWithEmailAndPassword(email, pass)
    .then(function(r) { me = r.user; boot(); })
    .catch(function(e) {
      var msg = 'Erreur de connexion';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Email ou mot de passe incorrect';
      else if (e.code === 'auth/invalid-email') msg = 'Email invalide';
      else if (e.code === 'auth/too-many-requests') msg = 'Trop de tentatives, réessayez plus tard';
      showAuthError(msg);
    });
};

window.doRegister = function() {
  var email = (document.getElementById('reg-email') || {}).value || '';
  var pass  = (document.getElementById('reg-pass') || {}).value || '';
  email = email.trim();
  if (!email || !pass) { showAuthError('Remplissez email et mot de passe'); return; }
  if (pass.length < 6) { showAuthError('Mot de passe trop court (6 caractères min)'); return; }
  if (!auth) { showAuthError('Chargement en cours, réessayez...'); setTimeout(window.doRegister, 800); return; }
  auth.createUserWithEmailAndPassword(email, pass)
    .then(function(r) { me = r.user; boot(); })
    .catch(function(e) {
      var msg = 'Erreur d\'inscription';
      if (e.code === 'auth/email-already-in-use') msg = 'Email déjà utilisé, connectez-vous';
      else if (e.code === 'auth/invalid-email') msg = 'Email invalide';
      else if (e.code === 'auth/weak-password') msg = 'Mot de passe trop faible';
      showAuthError(msg);
    });
};

window.doAnon = function() {
  me = { uid: 'visitor_' + Math.random().toString(36).slice(2, 8), isVisitor: true };
  boot();
};

window.doLogout = function() {
  if (me && !me.isVisitor && auth) auth.signOut().catch(function(){});
  me = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('splash').style.display = 'flex';
};

function showAuthError(msg) {
  var el = document.getElementById('auth-msg');
  if (!el) return;
  el.className = 'auth-msg err';
  el.textContent = msg;
  el.style.display = 'block';
}
function showAuthOk(msg) {
  var el = document.getElementById('auth-msg');
  if (!el) return;
  el.className = 'auth-msg ok';
  el.textContent = msg;
  el.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

window.switchView = function(v) {
  ['home','map','notifications','profile'].forEach(function(n) {
    var el = document.getElementById('view-' + n);
    if (!el) return;
    if (n === 'map') {
      el.style.display = n === v ? 'block' : 'none';
    } else {
      el.classList.toggle('hidden', n !== v);
    }
  });

  // Scroll to top
  var scroll = document.getElementById('main-scroll');
  if (scroll) scroll.scrollTop = 0;

  // Bottom nav active
  document.querySelectorAll('.bottom-nav-item').forEach(function(b) {
    b.classList.remove('active');
  });

  if (v === 'map') {
    setTimeout(initMap, 50);
  }
  if (v === 'profile') {
    updateProfileUI();
    renderMyListings();
    renderFavListings();
  }
  if (v === 'notifications') {
    renderNotifications();
  }

  // Sidebar active
  document.querySelectorAll('.sidebar-item').forEach(function(s) {
    s.classList.remove('active');
  });
};

window.filterCat = function(cat, el) {
  activeCat = cat;
  document.querySelectorAll('.cat-pill').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.sidebar-item').forEach(function(b) { b.classList.remove('active'); });
  if (el) el.classList.add('active');
  renderFeed();
};

window.applyFilters = function() {
  renderFeed();
};

// ═══════════════════════════════════════════════════════════════
// FEED
// ═══════════════════════════════════════════════════════════════

function getFilteredItems() {
  var q = (document.getElementById('search-input') || {}).value || '';
  q = q.toLowerCase().trim();
  return items.filter(function(i) {
    if (activeCat !== 'all' && i.category !== activeCat) return false;
    if (!q) return true;
    var haystack = ((i.itemName||'') + ' ' + (i.description||'') + ' ' + (i.city||'')).toLowerCase();
    return haystack.indexOf(q) >= 0;
  });
}

function renderFeed() {
  var feed = document.getElementById('feed');
  var empty = document.getElementById('empty-state');
  if (!feed) return;

  var list = getFilteredItems();
  feed.innerHTML = '';

  if (!list.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.forEach(function(item) {
    feed.appendChild(makeCard(item));
  });
}

function makeCard(item) {
  var div = document.createElement('div');
  div.className = 'product-card';
  div.onclick = function() { openDetail(item.id); };

  var isFav = favorites.has(item.id);
  var hasVideo = !!item.videoUrl;

  div.innerHTML =
    '<div class="product-card-media">' +
      '<img src="' + (item.imageUrl||'https://picsum.photos/seed/'+item.id+'/600/600') + '" alt="' + (item.itemName||'') + '" loading="lazy">' +
      (hasVideo ? '<span class="vid-badge"><i class="fa-solid fa-video" style="font-size:8px"></i> VIDÉO</span>' : '') +
      (item.condition ? '<span class="cond-badge">' + item.condition + '</span>' : '') +
      '<button class="fav-btn' + (isFav ? ' active' : '') + '" onclick="event.stopPropagation();toggleFav(\'' + item.id + '\',this)">' +
        '<i class="' + (isFav ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
      '</button>' +
    '</div>' +
    '<div class="product-card-info">' +
      '<div class="product-name">' + (item.itemName||'Objet') + '</div>' +
      '<div class="product-price">' + (item.price||0) + '€</div>' +
      '<div class="product-meta">' +
        (item.city ? '<span class="product-city"><i class="fa-solid fa-location-dot" style="font-size:9px;color:#0ea5e9"></i>' + item.city + '</span>' : '') +
      '</div>' +
    '</div>';

  return div;
}

// ═══════════════════════════════════════════════════════════════
// VIDEO SHORTS (Whatnot-style homepage)
// ═══════════════════════════════════════════════════════════════

function renderShorts() {
  var row = document.getElementById('shorts-row');
  if (!row) return;

  var videoItems = items.filter(function(i) { return !!i.videoUrl; });
  // Pad with non-video items if needed
  if (videoItems.length < 5) {
    items.forEach(function(i) {
      if (!i.videoUrl && videoItems.length < 8) videoItems.push(i);
    });
  }

  row.innerHTML = '';
  videoItems.slice(0, 8).forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'video-short-card';
    card.onclick = function() { openDetail(item.id); };

    if (item.videoUrl) {
      card.innerHTML =
        '<video src="' + item.videoUrl + '" muted loop autoplay playsinline style="width:100%;height:100%;object-fit:cover;display:block"></video>' +
        '<div class="video-short-overlay"></div>' +
        '<span class="video-badge"><i class="fa-solid fa-video" style="font-size:8px"></i> VIDÉO</span>';
    } else {
      card.innerHTML =
        '<img src="' + (item.imageUrl||'') + '" style="width:100%;height:100%;object-fit:cover;display:block">' +
        '<div class="video-short-overlay"></div>';
    }

    card.innerHTML +=
      '<div class="play-btn-overlay"><div><i class="fa-solid fa-play" style="color:#fff;font-size:16px;margin-left:3px"></i></div></div>' +
      '<div class="video-short-info">' +
        '<div class="video-short-price">' + (item.price||0) + '€</div>' +
        '<div class="video-short-name">' + (item.itemName||'') + '</div>' +
        '<div class="video-short-seller">' + (item.city||'') + '</div>' +
      '</div>';

    row.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════
// DETAIL MODAL
// ═══════════════════════════════════════════════════════════════

window.openDetail = function(id) {
  var item = items.find(function(i) { return i.id === id; });
  if (!item) return;
  curItem = item;

  var modal = document.getElementById('detail-modal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Titre + vignette
  document.getElementById('det-title-overlay').textContent = item.itemName || '';
  var thumbImg = document.getElementById('det-thumb-img');
  thumbImg.src = item.imageUrl || '';

  // Prix
  document.getElementById('det-price').textContent = (item.price||0) + '€';

  // Badges
  var badges = document.getElementById('det-badges');
  badges.innerHTML = '';
  if (item.condition) badges.innerHTML += '<span class="det-badge">' + item.condition + '</span>';
  if (item.city) badges.innerHTML += '<span class="det-badge"><i class="fa-solid fa-location-dot" style="color:#0ea5e9;font-size:9px;margin-right:4px"></i>' + item.city + '</span>';
  if (item.brand) badges.innerHTML += '<span class="det-badge">' + item.brand + '</span>';

  // Détection fraude
  var fraudWarn = document.getElementById('det-fraud-warn');
  if (fraudWarn) fraudWarn.style.display = 'none';
  if (item.price && item.itemName) {
    var low = item.itemName.toLowerCase();
    if ((low.indexOf('rolex') > -1 && item.price < 500) || (low.indexOf('iphone') > -1 && item.price < 50)) {
      if (fraudWarn) fraudWarn.style.display = 'block';
    }
  }

  // Favori
  var isFav = favorites.has(item.id);
  var favIcon = document.getElementById('det-fav-icon');
  if (favIcon) favIcon.className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';

  // Vendeur
  document.getElementById('det-seller-name').textContent = item.userId || 'Vendeur';
  document.getElementById('det-seller-rating').textContent = item.rating ? '★'.repeat(Math.round(item.rating)) + ' ' + item.rating + '/5' : 'Nouveau vendeur';

  // Description
  document.getElementById('det-desc-text').textContent = item.description || 'Aucune description.';

  // Livraison
  var shipList = document.getElementById('det-ship-list');
  if (shipList) {
    shipList.innerHTML = '';
    if (item.shipping && item.shipping.length) {
      item.shipping.forEach(function(s) {
        shipList.innerHTML +=
          '<div class="ship-option">' +
            '<span class="ship-method">' + s.method + '</span>' +
            '<span class="ship-price">' + (s.price === 0 ? 'Gratuit' : s.price + '€') + '</span>' +
          '</div>';
      });
    } else {
      shipList.innerHTML = '<span style="font-size:13px;color:rgba(255,255,255,.4)">Non précisé</span>';
    }
  }

  // Trust score
  var trustScore = computeTrust(item);
  var trustLabel = document.getElementById('det-trust-label');
  var trustFill  = document.getElementById('det-trust-fill');
  var trustColor = trustScore >= 75 ? '#22c55e' : trustScore >= 50 ? '#f59e0b' : '#ef4444';
  if (trustLabel) { trustLabel.textContent = trustScore + '/100'; trustLabel.style.color = trustColor; }
  if (trustFill)  trustFill.style.width = trustScore + '%';

  // Ville
  var locCity = document.getElementById('det-loc-city');
  if (locCity) locCity.textContent = item.city || '';

  // Média
  if (item.videoUrl) {
    showVideoMode(item);
  } else {
    showPhotoMode(item);
  }

  // Boutons achat/contact
  setupDetailButtons(item);
};

function showVideoMode(item) {
  document.getElementById('det-video-wrap').style.display = 'flex';
  document.getElementById('det-photo-wrap').style.display = 'none';

  var vid = document.getElementById('det-video');
  vid.src = item.videoUrl;
  vid.load();

  vid.ontimeupdate = function() {
    var prog = document.getElementById('vid-progress');
    if (prog && vid.duration) {
      prog.value = (vid.currentTime / vid.duration) * 100;
    }
    var timeEl = document.getElementById('vid-time');
    if (timeEl) timeEl.textContent = fmtTime(vid.currentTime) + ' / ' + fmtTime(vid.duration);
  };

  // Photo strip
  var strip = document.getElementById('vid-photo-strip');
  if (strip) {
    strip.innerHTML = '';
    var photos = getItemPhotos(item);
    photos.forEach(function(url, idx) {
      var t = document.createElement('div');
      t.className = 'photo-strip-thumb';
      t.innerHTML = '<img src="' + url + '">';
      t.onclick = function() {
        document.querySelectorAll('.photo-strip-thumb').forEach(function(x) { x.classList.remove('active'); });
        t.classList.add('active');
      };
      strip.appendChild(t);
    });
    if (!strip.children.length) {
      document.querySelector('.photo-strip') && (document.querySelector('.photo-strip').style.display = 'none');
    }
  }
}

function showPhotoMode(item) {
  document.getElementById('det-video-wrap').style.display = 'none';
  document.getElementById('det-photo-wrap').style.display = 'flex';

  var photos = getItemPhotos(item);
  var track = document.getElementById('carousel-track');
  if (!track) return;

  track.innerHTML = '';
  carIdx = 0;

  photos.forEach(function(url) {
    var slide = document.createElement('div');
    slide.style.cssText = 'flex-shrink:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000';
    slide.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:100%;object-fit:contain">';
    track.appendChild(slide);
  });

  var prev = document.getElementById('car-prev');
  var next = document.getElementById('car-next');
  if (prev) prev.style.display = photos.length > 1 ? 'flex' : 'none';
  if (next) next.style.display = photos.length > 1 ? 'flex' : 'none';

  updateCarousel();
  renderDots(photos.length);
}

function getItemPhotos(item) {
  var photos = [];
  if (item.imageUrl) photos.push(item.imageUrl);
  if (item.extraPhotos) item.extraPhotos.forEach(function(p) { if (p) photos.push(p); });
  if (!photos.length) photos.push('https://picsum.photos/seed/' + item.id + '/600/600');
  return photos;
}

window.carNav = function(dir) {
  var track = document.getElementById('carousel-track');
  if (!track) return;
  var total = track.children.length;
  carIdx = Math.max(0, Math.min(carIdx + dir, total - 1));
  updateCarousel();
};

function updateCarousel() {
  var track = document.getElementById('carousel-track');
  if (!track) return;
  track.style.transform = 'translateX(-' + (carIdx * 100) + '%)';
  updateDots(carIdx);
}

function renderDots(total) {
  var dots = document.getElementById('car-dots');
  if (!dots) return;
  dots.innerHTML = '';
  for (var i = 0; i < total; i++) {
    var d = document.createElement('div');
    d.style.cssText = 'width:6px;height:6px;border-radius:50%;background:' + (i === 0 ? '#fff' : 'rgba(255,255,255,.4)');
    dots.appendChild(d);
  }
}

function updateDots(idx) {
  var dots = document.getElementById('car-dots');
  if (!dots) return;
  Array.from(dots.children).forEach(function(d, i) {
    d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,.4)';
    d.style.transform = i === idx ? 'scale(1.2)' : 'scale(1)';
  });
}

function setupDetailButtons(item) {
  var buyBtn = document.getElementById('det-buy-btn');
  if (buyBtn) buyBtn.onclick = function() { openPayment(item); };
  var contactBtn = document.getElementById('det-contact-btn');
  if (contactBtn) contactBtn.onclick = function() { openContact(item); };
}

window.closeDetail = function() {
  var modal = document.getElementById('detail-modal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Stop video
  var vid = document.getElementById('det-video');
  if (vid) { vid.pause(); vid.src = ''; }
  // Reset accordions
  ['acc-desc','acc-ship','acc-trust','acc-map'].forEach(function(id) {
    var el = document.getElementById(id);
    var icon = document.getElementById(id + '-icon');
    if (el) el.classList.remove('open');
    if (icon) icon.classList.remove('open');
  });
  curItem = null;
};

// ── Video controls ──
window.vidTogglePlay = function() {
  var vid = document.getElementById('det-video');
  if (!vid) return;
  var overlay = document.getElementById('vid-play-overlay');
  var icon = document.getElementById('vid-play-icon');
  var btnIcon = document.getElementById('vid-btn-icon');
  if (vid.paused) {
    vid.play();
    if (icon) icon.className = 'fa-solid fa-pause';
    if (btnIcon) btnIcon.className = 'fa-solid fa-pause';
    if (overlay) { overlay.style.opacity = '1'; setTimeout(function() { overlay.style.opacity = '0'; }, 600); }
  } else {
    vid.pause();
    if (icon) icon.className = 'fa-solid fa-play';
    if (btnIcon) btnIcon.className = 'fa-solid fa-play';
    if (overlay) overlay.style.opacity = '1';
  }
};

window.vidSeek = function(val) {
  var vid = document.getElementById('det-video');
  if (vid && vid.duration) vid.currentTime = (val / 100) * vid.duration;
};

window.vidToggleMute = function() {
  var vid = document.getElementById('det-video');
  var icon = document.getElementById('vid-mute-icon');
  if (!vid) return;
  vid.muted = !vid.muted;
  if (icon) icon.className = vid.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
};

window.vidFullscreen = function() {
  var vid = document.getElementById('det-video');
  if (!vid) return;
  if (vid.requestFullscreen) vid.requestFullscreen();
  else if (vid.webkitRequestFullscreen) vid.webkitRequestFullscreen();
};

function fmtTime(t) {
  if (!t || isNaN(t)) return '0:00';
  var m = Math.floor(t / 60);
  var s = Math.floor(t % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ── Accordion ──
window.toggleAcc = function(id) {
  var el   = document.getElementById(id);
  var icon = document.getElementById(id + '-icon');
  if (!el) return;
  var isOpen = el.classList.toggle('open');
  if (icon) icon.classList.toggle('open', isOpen);
  if (id === 'acc-map' && isOpen) setTimeout(initDetailMap, 80);
};

// ── Similar page ──
window.openSimilarPage = function() {
  if (!curItem) return;
  var cat = curItem.category || '';
  var similar = items.filter(function(i) {
    return i.id !== curItem.id && i.category === cat;
  });
  if (!similar.length) similar = items.filter(function(i) { return i.id !== curItem.id; });

  var page = document.getElementById('similar-page');
  var grid = document.getElementById('similar-grid');
  var countEl = document.getElementById('similar-count');

  if (countEl) countEl.textContent = similar.length + ' résultats';
  if (grid) {
    grid.innerHTML = '';
    similar.forEach(function(item) {
      var card = document.createElement('div');
      card.style.cursor = 'pointer';
      card.onclick = function() { closeSimilarPage(); openDetail(item.id); };
      card.innerHTML =
        '<div style="aspect-ratio:1/1;background:#1e293b;border-radius:14px;overflow:hidden;margin-bottom:8px;border:1px solid rgba(255,255,255,.07)">' +
          '<img src="' + (item.imageUrl||'') + '" style="width:100%;height:100%;object-fit:contain;padding:6px">' +
        '</div>' +
        (item.videoUrl ? '<div style="display:inline-flex;align-items:center;gap:3px;background:rgba(14,165,233,.12);border-radius:99px;padding:2px 8px;margin-bottom:4px"><i class=\'fa-solid fa-video\' style=\'color:#0ea5e9;font-size:8px\'></i><span style=\'font-size:9px;font-weight:800;color:#0ea5e9\'>VIDÉO</span></div><br>' : '') +
        '<div style="font-size:12px;font-weight:700;color:rgba(255,255,255,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (item.itemName||'') + '</div>' +
        '<div style="font-size:15px;font-weight:900;color:#0ea5e9">' + (item.price||0) + '€</div>';
      grid.appendChild(card);
    });
  }
  if (page) page.classList.add('open');
};

window.closeSimilarPage = function() {
  var page = document.getElementById('similar-page');
  if (page) page.classList.remove('open');
};

// ─────────────────────────────────────────────
// FAVORIS
// ─────────────────────────────────────────────

window.toggleFav = function(id, btn) {
  if (favorites.has(id)) {
    favorites.delete(id);
    if (btn) btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    if (btn) btn.classList.remove('active');
  } else {
    favorites.add(id);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    if (btn) btn.classList.add('active');
  }
  localStorage.setItem('yb_favs', JSON.stringify([...favorites]));
};

window.toggleFavDetail = function() {
  if (!curItem) return;
  var isFav = favorites.has(curItem.id);
  var icon = document.getElementById('det-fav-icon');
  if (isFav) {
    favorites.delete(curItem.id);
    if (icon) icon.className = 'fa-regular fa-heart';
  } else {
    favorites.add(curItem.id);
    if (icon) icon.className = 'fa-solid fa-heart';
  }
  localStorage.setItem('yb_favs', JSON.stringify([...favorites]));
  toast(isFav ? 'Retiré des favoris' : '❤️ Ajouté aux favoris', !isFav);
};

window.shareItem = function() {
  if (!curItem) return;
  var url = 'https://youbiiiz.app/item/' + curItem.id;
  if (navigator.share) {
    navigator.share({ title: curItem.itemName, text: curItem.price + '€', url: url });
  } else {
    navigator.clipboard.writeText(url).then(function() { toast('Lien copié !', true); });
  }
};

window.reportItem = function() {
  toast('Signalement envoyé');
};

window.openOffer = function() {
  if (!curItem) return;
  toast('Fonctionnalité bientôt disponible');
};

window.openContact = function(item) {
  toast('Message envoyé au vendeur !', true);
};

window.openPayment = function(item) {
  toast('Redirection vers le paiement sécurisé...', true);
};

window.openSeller = function() {
  toast('Profil vendeur bientôt disponible');
};

// ─────────────────────────────────────────────
// TRUST SCORE
// ─────────────────────────────────────────────

function computeTrust(item) {
  var score = 50;
  if (item.imageUrl) score += 10;
  if (item.videoUrl) score += 20;
  if (item.description && item.description.length > 30) score += 10;
  if (item.city) score += 5;
  if (item.brand) score += 5;
  return Math.min(100, score);
}

// ─────────────────────────────────────────────
// MAPS
// ─────────────────────────────────────────────

function initMap() {
  if (!mapObj) {
    var el = document.getElementById('leaflet-map');
    if (!el || typeof L === 'undefined') return;
    mapObj = L.map('leaflet-map').setView([46.6, 2.3], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(mapObj);
  }
  items.forEach(function(item) {
    if (!item.lat || !item.lng) return;
    var m = L.marker([item.lat, item.lng]).addTo(mapObj);
    m.on('click', function() { openDetail(item.id); });
    m.bindPopup('<b>' + (item.itemName||'') + '</b><br>' + (item.price||0) + '€');
  });
}

function initDetailMap() {
  if (!curItem || !curItem.lat || !curItem.lng) return;
  if (typeof L === 'undefined') return;
  var el = document.getElementById('det-map');
  if (!el) return;
  if (el._leaflet_id) return;
  var m = L.map(el).setView([curItem.lat, curItem.lng], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m);
  L.circle([curItem.lat, curItem.lng], { radius: 800, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.15 }).addTo(m);
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

function updateProfileUI() {
  if (!me) return;
  var el = document.getElementById('profile-uid');
  if (el) el.textContent = me.isVisitor ? 'Visiteur' : (me.email || me.uid.slice(0, 12));

  var myItems = items.filter(function(i) { return i.userId === me.uid; });
  var el2 = document.getElementById('profile-count');
  if (el2) el2.textContent = myItems.length;

  var el3 = document.getElementById('profile-favs');
  if (el3) el3.textContent = favorites.size;

  var totalVal = myItems.reduce(function(s, i) { return s + (i.price||0); }, 0);
  var el4 = document.getElementById('profile-total');
  if (el4) el4.textContent = totalVal + '€';
}

function renderMyListings() {
  var grid = document.getElementById('my-listings');
  if (!grid) return;
  var myItems = items.filter(function(i) { return me && i.userId === me.uid; });
  grid.innerHTML = '';
  if (!myItems.length) {
    grid.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:20px">Aucune annonce publiée</div>';
    return;
  }
  myItems.forEach(function(item) {
    grid.appendChild(makeCard(item));
  });
}

function renderFavListings() {
  var grid = document.getElementById('fav-listings');
  if (!grid) return;
  var favItems = items.filter(function(i) { return favorites.has(i.id); });
  grid.innerHTML = '';
  if (!favItems.length) {
    grid.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:20px">Aucun favori</div>';
    return;
  }
  favItems.forEach(function(item) {
    grid.appendChild(makeCard(item));
  });
}

function renderNotifications() {
  var list = document.getElementById('notif-list');
  if (!list) return;
  list.innerHTML = '<div style="color:#94a3b8;font-size:14px;text-align:center;padding:40px">Aucune notification pour le moment</div>';
}

// ─────────────────────────────────────────────
// PUBLISH MODAL
// ─────────────────────────────────────────────

window.openPublish = function() {
  if (!me) { toast('Connectez-vous pour publier'); return; }
  var modal = document.getElementById('publish-modal');
  if (modal) modal.classList.add('open');
};

window.closePublish = function() {
  var modal = document.getElementById('publish-modal');
  if (modal) modal.classList.remove('open');
  resetPublishForm();
};

function resetPublishForm() {
  mainPhotoData = null;
  extraPhotos = [];
  videoFile = null;
  scanData = null;
  ['pub-title','pub-price','pub-desc','pub-city'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var mainZone = document.getElementById('main-photo-zone');
  var mainPreview = document.getElementById('main-photo-preview');
  if (mainZone) mainZone.style.display = 'block';
  if (mainPreview) mainPreview.style.display = 'none';
  document.getElementById('ai-status') && (document.getElementById('ai-status').style.display = 'none');
  document.getElementById('video-zone') && (document.getElementById('video-zone').style.display = 'block');
  document.getElementById('video-preview') && (document.getElementById('video-preview').style.display = 'none');
  var extras = document.getElementById('extra-photos-list');
  if (extras) extras.innerHTML = '<button onclick="document.getElementById(\'extra-photos-inp\').click()" style="width:64px;height:64px;border:2px dashed #e2e8f0;border-radius:12px;background:#f8fafc;font-size:20px;color:#94a3b8">+</button>';
}

// ── Photo principale ──
window.onMainPhoto = function(input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    processMainPhoto(e.target.result);
  };
  reader.readAsDataURL(file);
};

function processMainPhoto(b64) {
  resizeImage(b64, function(resized) {
    mainPhotoData = resized;
    // Afficher preview
    var zone = document.getElementById('main-photo-zone');
    var preview = document.getElementById('main-photo-preview');
    var img = document.getElementById('main-photo-img');
    if (zone) zone.style.display = 'none';
    if (img) img.src = resized;
    if (preview) preview.style.display = 'block';
    // Lancer analyse IA
    analyzePhoto(resized);
  });
}

window.removeMainPhoto = function() {
  mainPhotoData = null;
  scanData = null;
  var zone = document.getElementById('main-photo-zone');
  var preview = document.getElementById('main-photo-preview');
  var aiStatus = document.getElementById('ai-status');
  if (zone) zone.style.display = 'block';
  if (preview) preview.style.display = 'none';
  if (aiStatus) aiStatus.style.display = 'none';
  document.getElementById('main-photo-inp').value = '';
};

// ── Image resizing (contain, haute qualité) ──
function resizeImage(b64, cb) {
  var img = new Image();
  img.onload = function() {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) { cb(b64); return; }
    var TARGET = 1200, PAD = 40;
    var scale = Math.min((TARGET - PAD*2) / w, (TARGET - PAD*2) / h);
    var dw = Math.round(w * scale), dh = Math.round(h * scale);
    var dx = Math.round((TARGET - dw) / 2), dy = Math.round((TARGET - dh) / 2);
    var canvas = document.createElement('canvas');
    canvas.width = TARGET; canvas.height = TARGET;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TARGET, TARGET);
    ctx.drawImage(img, 0, 0, w, h, dx, dy, dw, dh);
    cb(canvas.toDataURL('image/jpeg', 0.93));
  };
  img.onerror = function() { cb(b64); };
  img.src = b64;
}

// ── Analyse IA ──
function analyzePhoto(b64) {
  var statusEl = document.getElementById('ai-status');
  var pending  = document.getElementById('ai-pending');
  var done     = document.getElementById('ai-done');
  var progress = document.getElementById('ai-progress');
  var step     = document.getElementById('ai-step');

  if (statusEl) statusEl.style.display = 'block';
  if (pending) pending.style.display = 'block';
  if (done) done.style.display = 'none';

  var steps = ['Identification de l\'objet...', 'Estimation du prix...', 'Vérification de l\'état...', 'Génération de la description...'];
  var pcts  = [20, 50, 75, 90];
  var si = 0;
  var interval = setInterval(function() {
    if (si < steps.length) {
      if (step) step.textContent = steps[si];
      if (progress) progress.style.width = pcts[si] + '%';
      si++;
    }
  }, 500);

  fetch('https://analyzeimage-xjtnixfrra-uc.a.run.app', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: b64.split(',')[1], mimeType: 'image/jpeg' })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    clearInterval(interval);
    if (progress) progress.style.width = '100%';
    if (pending) pending.style.display = 'none';
    if (done) done.style.display = 'block';

    scanData = d;
    if (d.title)       { var t = document.getElementById('pub-title'); if (t && !t.value) t.value = d.title; }
    if (d.price)       { var p = document.getElementById('pub-price'); if (p && !p.value) p.value = d.price; }
    if (d.description) { var desc = document.getElementById('pub-desc'); if (desc && !desc.value) desc.value = d.description; }
    if (d.category) {
      var sel = document.getElementById('pub-cat');
      if (sel) for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === d.category) { sel.selectedIndex = i; break; }
      }
    }
    if (d.condition) {
      var cond = document.getElementById('pub-cond');
      if (cond) for (var i = 0; i < cond.options.length; i++) {
        if (cond.options[i].value === d.condition) { cond.selectedIndex = i; break; }
      }
    }
  })
  .catch(function() {
    clearInterval(interval);
    if (pending) pending.style.display = 'none';
  });
}

// ── Photos supplémentaires ──
window.onExtraPhotos = function(input) {
  Array.from(input.files).forEach(function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      resizeImage(e.target.result, function(resized) {
        extraPhotos.push(resized);
        addExtraThumb(resized, extraPhotos.length - 1);
      });
    };
    reader.readAsDataURL(file);
  });
};

function addExtraThumb(url, idx) {
  var list = document.getElementById('extra-photos-list');
  if (!list) return;
  var thumb = document.createElement('div');
  thumb.style.cssText = 'position:relative;width:64px;height:64px;border-radius:12px;overflow:hidden;border:1.5px solid #e2e8f0';
  thumb.innerHTML =
    '<img src="' + url + '" style="width:100%;height:100%;object-fit:contain">' +
    '<button onclick="removeExtraPhoto(' + idx + ',this.parentNode)" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.6);border:none;color:#fff;font-size:8px;cursor:pointer;display:flex;align-items:center;justify-content:center"><i class=\'fa-solid fa-xmark\'></i></button>';
  // Insert before the + button
  var addBtn = list.firstChild;
  list.insertBefore(thumb, addBtn);
}

window.removeExtraPhoto = function(idx, el) {
  extraPhotos[idx] = null;
  if (el) el.remove();
};

// ── Vidéo ──
window.onVideoUpload = function(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 500 * 1024 * 1024) { toast('Vidéo trop lourde (max 500 Mo)'); return; }
  videoFile = file;
  var url = URL.createObjectURL(file);
  var player = document.getElementById('vid-preview-player');
  player.src = url;
  player.load();
  document.getElementById('video-zone').style.display = 'none';
  document.getElementById('video-preview').style.display = 'block';
  player.onloadedmetadata = function() {
    var dur = Math.round(player.duration);
    var m = Math.floor(dur/60), s = dur%60;
    var badge = document.getElementById('vid-dur-badge');
    if (badge) badge.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  };
};

window.removeVideo = function() {
  videoFile = null;
  document.getElementById('video-zone').style.display = 'block';
  document.getElementById('video-preview').style.display = 'none';
  document.getElementById('video-inp').value = '';
};

// ── Publication ──
window.publishItem = function() {
  if (!me || me.isVisitor) { toast('Connectez-vous pour publier'); return; }
  var title = (document.getElementById('pub-title') || {}).value || '';
  var price = parseFloat((document.getElementById('pub-price') || {}).value) || 0;
  if (!title || !price) { toast('Titre et prix requis'); return; }
  if (!mainPhotoData) { toast('Ajoutez au moins une photo'); return; }

  var btn = document.getElementById('pub-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Publication...'; }

  var city = (document.getElementById('pub-city') || {}).value || '';
  geocodeCity(city, function(coords) {
    var newItem = {
      userId: me.uid,
      itemName: title,
      price: price,
      condition: (document.getElementById('pub-cond') || {}).value || 'Bon état',
      category: (document.getElementById('pub-cat') || {}).value || '',
      description: (document.getElementById('pub-desc') || {}).value || '',
      imageUrl: mainPhotoData,
      extraPhotos: extraPhotos.filter(function(p) { return !!p; }),
      city: city,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      shipping: getShippingOptions(),
      hasVideo: !!videoFile,
      createdAt: { seconds: Date.now() / 1000 },
      views: 0
    };

    if (db) {
      db.collection('scans').add(newItem)
        .then(function(ref) {
          newItem.id = ref.id;
          items.unshift(newItem);
          afterPublish(newItem);
        })
        .catch(function(e) {
          // Fallback local
          newItem.id = 'local_' + Date.now();
          items.unshift(newItem);
          afterPublish(newItem);
        });
    } else {
      newItem.id = 'local_' + Date.now();
      items.unshift(newItem);
      afterPublish(newItem);
    }
  });
};

function afterPublish(item) {
  closePublish();
  renderFeed();
  renderShorts();
  switchView('home');
  toast('Annonce publiée !', true);
  var btn = document.getElementById('pub-btn');
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rocket" style="margin-right:6px"></i>Publier l\'annonce'; }
}

function getShippingOptions() {
  var opts = [];
  if (document.getElementById('ship-hand') && document.getElementById('ship-hand').checked)
    opts.push({ method: 'Main propre', price: 0 });
  if (document.getElementById('ship-colis') && document.getElementById('ship-colis').checked)
    opts.push({ method: 'Colissimo', price: 8 });
  if (document.getElementById('ship-relay') && document.getElementById('ship-relay').checked)
    opts.push({ method: 'Mondial Relay', price: 5 });
  return opts;
}

function geocodeCity(city, cb) {
  if (!city) { cb(null); return; }
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(city) + '&limit=1')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d && d[0]) cb({ lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) });
      else cb(null);
    })
    .catch(function() { cb(null); });
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────

window.toast = function(msg, ok) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = ok ? 'ok' : 'err';
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.style.display = 'none'; }, 3000);
};

// ─────────────────────────────────────────────
// GLOBAL ERROR
// ─────────────────────────────────────────────

window.onerror = function(msg, src, line) {
  console.error('JS Error:', msg, 'L' + line);
  toast('Erreur: ' + msg.slice(0, 60));
};

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  initFirebase();
});
