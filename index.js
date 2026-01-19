// Aggiunta debounceInvalidateSize per fix dimensionamento mappa
var _debounceTimer;
window.debounceInvalidateSize = function() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(function() {
    if (window.mapMap && typeof window.mapMap.invalidateSize === 'function') {
      window.mapMap.invalidateSize();
    }
  }, 100);
};
// --- MODALE INFO HOTSPOT MODERNO ---
function showInfoHotspot(title, text, imageUrl) {
  var existing = document.getElementById('info-modal');
  if (!existing) {
    var modal = document.createElement('div');
    modal.id = 'info-modal';
    modal.innerHTML = `
      <div class="info-backdrop" id="info-backdrop"></div>
      <div class="info-content" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <button class="info-close" id="info-close" aria-label="Chiudi">✕</button>
        <div class="info-flex">
          <div class="info-text">
            <h3 id="info-title"></h3>
            <div id="info-body"></div>
          </div>
          <div class="info-image" id="info-image" aria-hidden="true">
            <img id="info-image-img" src="" alt="" />
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    var css = `
      #info-modal { position: fixed; inset: 0; z-index: 20000; display: block; }
      #info-modal .info-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
      #info-modal .info-content { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: min(760px, calc(100% - 40px)); max-height: calc(100vh - 80px); overflow-y: auto; background: linear-gradient(180deg,#0f0f12, #0b0c11); color: #fff; padding: 24px 24px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); font-family: 'Segoe UI', 'Inter', system-ui, sans-serif; }
      #info-modal .info-close { position: absolute; right: 14px; top: 14px; background: transparent; border: none; color: #fff; font-size: 18px; cursor: pointer; }
      #info-modal .info-flex { display: flex; gap: 14px; align-items: flex-start; }
      #info-modal .info-text { flex: 1 1 60%; }
      #info-modal .info-image { flex: 0 0 180px; display: none; }
      #info-modal .info-image img { width: 100%; height: auto; border-radius: 6px; display:block }
      #info-modal h3 { margin: 2px 0 8px 0; font-size: 18px; letter-spacing: 0.3px; }
      #info-modal #info-body { font-size: 14px; color: #ddd; white-space: pre-wrap; line-height: 1.6; letter-spacing: 0.5px; }

      /* Responsive: stacked layout for small/portrait screens */
      @media (max-width:700px), (orientation: portrait) {
        #info-modal .info-content { width: calc(100% - 20px); padding: 14px; max-height: calc(100vh - 34px); }
        #info-modal .info-flex { display: block; }
        #info-modal .info-image { display: block; width: 100%; flex: none; margin-top: 12px; }
        #info-modal .info-text { padding: 0; }
        #info-modal #info-body { font-size: 15px; line-height: 1.5; }
        #info-modal .info-close { right: 10px; top: 8px; }
      }
    `;
    var style = document.createElement('style'); style.appendChild(document.createTextNode(css)); document.head.appendChild(style);
    modal.querySelector('#info-close').addEventListener('click', hideInfoHotspot);
    modal.querySelector('#info-backdrop')?.addEventListener('click', hideInfoHotspot);
    document.addEventListener('keydown', function onEsc(e){ if (e.key === 'Escape') hideInfoHotspot(); });
  }
  document.getElementById('info-title').innerText = title || '';
  var infoBody = document.getElementById('info-body');
  infoBody.innerText = text || '';
  // Add read-more for long texts on small/portrait screens
  try {
    var maxLen = 280; // approx chars before truncation on mobile
    if (window.innerWidth <= 700 && (text || '').length > maxLen) {
      var shortText = text.slice(0, maxLen).trim() + '…';
      infoBody.innerText = shortText;
      var more = document.createElement('button');
      more.className = 'info-readmore';
      more.textContent = 'Leggi tutto';
      more.style.marginTop = '8px';
      more.style.background = 'transparent';
      more.style.border = 'none';
      more.style.color = '#4da6ff';
      more.style.cursor = 'pointer';
      more.addEventListener('click', function(){
        infoBody.innerText = text;
        more.remove();
      });
      // Attach if not already present
      var wrap = infoBody.parentNode;
      if (!wrap.querySelector('.info-readmore')) wrap.appendChild(more);
    }
  } catch(e) {}
  var imgWrap = document.getElementById('info-image');
  var imgEl = document.getElementById('info-image-img');
  if (imageUrl) {
    imgEl.src = imageUrl;
    imgEl.alt = title || '';
    imgWrap.style.display = 'block';
  } else {
    imgEl.src = '';
    imgWrap.style.display = 'none';
  }
}

function hideInfoHotspot() {
  var modal = document.getElementById('info-modal');
  if (modal) modal.remove();
}
'use strict';

// Expose helper globally: used in several places outside DOMContentLoaded
window.isMobileScreen = function() {
  return window.innerWidth <= 900 || /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};
'use strict';

(function() {
document.addEventListener('DOMContentLoaded', function() {
  /* --- GIROSCOPIO: lazy-init definitivo (crea il metodo solo dopo click/permesso) --- */
  var deviceOrientationControlMethod = null;
  var gyroEnabled = false;
  var deviceOrientationHandler = null;
  var deviceOrientationPending = false;

  function toggleGyro() {
    var btn = document.getElementById('gyroToggle');
    if (!btn) return;

    if (!window.DeviceOrientationEvent) {
      alert('Il tuo dispositivo non supporta il giroscopio.');
      return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(function(permissionState) {
          if (permissionState === 'granted') {
            activateGyroLogic(btn);
          } else {
            alert('Permesso negato. Vai in Impostazioni > Safari > Accesso movim. e orientamento');
          }
        })
        .catch(function(err) {
          console.warn(err);
          // Su alcuni Android può fallire ma funzionare: proviamo comunque
          activateGyroLogic(btn);
        });
    } else {
      activateGyroLogic(btn);
    }
  }

  function activateGyroLogic(btn) {
    gyroEnabled = !gyroEnabled;

    var svgGyroOff = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="2" y="7" width="20" height="10" rx="3" fill="rgba(52,152,219,0.18)" stroke="#fff"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>';
    var svgGyroOn = '<svg viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="2" y="7" width="20" height="10" rx="3" fill="rgba(52,152,219,0.3)" stroke="#3498db"/><circle cx="12" cy="12" r="4" fill="#3498db"/></svg>';

    var controls = (window.viewer && typeof window.viewer.controls === 'function') ? window.viewer.controls() : null;

    if (gyroEnabled) {
      try { stopAutorotate(); } catch(e){}


      if (!deviceOrientationControlMethod) {
        try {
          deviceOrientationControlMethod = new Marzipano.DeviceOrientationControlMethod();
        } catch(e) {
          console.error('Errore creazione giroscopio (native unavailable):', e);
          deviceOrientationControlMethod = null;
        }
      }

      if (controls && deviceOrientationControlMethod) {
        try { controls.registerMethod('deviceOrientation', deviceOrientationControlMethod, true); } catch(e) { console.warn('registerMethod failed', e); }
      } else if (!deviceOrientationControlMethod && controls) {
        // Fallback manuale: registra listener deviceorientation che imposta lo yaw
        if (!deviceOrientationHandler) {
          deviceOrientationHandler = function(ev) {
            if (deviceOrientationPending) return;
            deviceOrientationPending = true;
            requestAnimationFrame(function() {
              deviceOrientationPending = false;
              try {
                if (!viewer || typeof viewer.scene !== 'function') return;
                var active = viewer.scene();
                if (!active) return;
                // trova la view corrispondente nell'array scenes
                var activeView = null;
                for (var i = 0; i < scenes.length; i++) {
                  if (scenes[i].scene === active) { activeView = scenes[i].view; break; }
                }
                if (!activeView) return;

                // Yaw: keep previous behavior (alpha -> yaw)
                var alpha = ev.alpha;
                if (alpha == null) return;
                var yaw = -alpha * Math.PI / 180;

                // Pitch: map beta (front/back tilt) to view pitch
                // DeviceOrientation beta: range approx [-180,180]. We map so that beta ~= 90 -> pitch 0
                // and small deviations around 90 produce small pitch changes.
                var pitch = 0;
                if (typeof ev.beta === 'number') {
                  var beta = ev.beta;
                  // Normalize beta to [-180,180]
                  if (beta > 180) beta -= 360;
                  // Map beta -> pitch radians: pitch = (beta - 90) deg -> 0 when beta==90
                  pitch = (beta - 90) * Math.PI / 180;
                  // Clamp to avoid extreme values (keep slightly within +/- 90deg)
                  var MAX_PITCH = Math.PI/2 - 0.12; // ~~89deg safe margin
                  if (pitch > MAX_PITCH) pitch = MAX_PITCH;
                  if (pitch < -MAX_PITCH) pitch = -MAX_PITCH;
                }

                var curParams = null;
                try { if (typeof activeView.parameters === 'function') curParams = activeView.parameters(); } catch(e) { curParams = null; }
                var curYaw = curParams && typeof curParams.yaw === 'number' ? curParams.yaw : yaw;
                // Smoothly apply yaw/pitch (direct set to stay responsive)
                try { activeView.setParameters({ yaw: yaw, pitch: pitch }); } catch(e) {}
              } catch(e) { console.warn('manual deviceorientation handler failed', e); }
            });
          };
        }
        try { window.addEventListener('deviceorientation', deviceOrientationHandler, true); } catch(e) { console.warn('addEventListener deviceorientation failed', e); }
      }

      try { btn.innerHTML = svgGyroOn; btn.classList.add('active'); } catch(e){}
    } else {
      if (controls) {
        try {
          if (typeof controls.deregisterMethod === 'function') controls.deregisterMethod('deviceOrientation');
          else if (typeof controls.unregisterMethod === 'function') controls.unregisterMethod('deviceOrientation');
        } catch(e) { console.warn('disable native gyro failed', e); }
        // remove manual fallback listener if present
        try { if (deviceOrientationHandler) { window.removeEventListener('deviceorientation', deviceOrientationHandler, true); } } catch(e) {}
      }
      try { btn.innerHTML = svgGyroOff; btn.classList.remove('active'); } catch(e){}
      try { startAutorotate(); } catch(e){}
    }
  }

  // Aggancia evento al pulsante (safe bind)
  (function bindGyroBtn() {
    var gyroBtn = document.getElementById('gyroToggle');
    if (!gyroBtn) return;
    if (!gyroBtn.dataset.bound) {
      gyroBtn.addEventListener('click', function(e){ if (e && e.preventDefault) e.preventDefault(); toggleGyro(); });
      gyroBtn.dataset.bound = '1';
    }
    // Mostra il pulsante solo su mobile/smartphone con supporto sensori
    try {
      var supported = (typeof DeviceOrientationEvent !== 'undefined') && (typeof DeviceOrientationEvent.requestPermission === 'function' || 'ondeviceorientation' in window);
      var shouldShow = (typeof window.isMobileScreen === 'function' ? window.isMobileScreen() : /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent));
      if (shouldShow && supported) {
        gyroBtn.style.display = 'inline-flex'; gyroBtn.style.visibility = 'visible'; gyroBtn.style.opacity = '1';
      } else {
        gyroBtn.style.display = 'none';
      }
    } catch(e){}
  })();
  /* --- fine giroscopio --- */
});
// ...existing code...
      // Frecce laterali panorama
      var panoArrowLeft = document.getElementById('panoArrowLeft');
      var panoArrowRight = document.getElementById('panoArrowRight');
      // When true, updateUI will avoid expanding the bottom/thumbnails bar for the next scene switch
      window.suppressThumbOpen = window.suppressThumbOpen || false;
      // ...existing code...
      if (panoArrowLeft) {
        panoArrowLeft.addEventListener('click', function(e) {
          if (e && e.stopPropagation) { e.stopPropagation(); e.preventDefault(); }
          var idx = getCurrentThumbIndex();
          var next = (idx - 1 + scenes.length) % scenes.length;
          // Prevent the bottom bar / thumbnails from auto-opening when navigating via pano arrows
          window.suppressThumbOpen = true;
          // Add a timed lock so transient clears don't re-enable expansion too early
          try { window.suppressThumbOpenUntil = Date.now() + 800; } catch(e){}
          try { switchScene(scenes[next]); } catch(e){console.warn('switchScene failed', e);}        
        });
      }
      if (panoArrowRight) {
        panoArrowRight.addEventListener('click', function(e) {
          if (e && e.stopPropagation) { e.stopPropagation(); e.preventDefault(); }
          var idx = getCurrentThumbIndex();
          var next = (idx + 1) % scenes.length;
          // Prevent the bottom bar / thumbnails from auto-opening when navigating via pano arrows
          window.suppressThumbOpen = true;
          try { window.suppressThumbOpenUntil = Date.now() + 800; } catch(e){}
          try { switchScene(scenes[next]); } catch(e){console.warn('switchScene failed', e);}        
        });
      }
      // Ensure pano arrows are always visible; JS no longer hides them — style controls prominence
      function updatePanoArrowsVisibility() {
        try {
          var left = document.getElementById('panoArrowLeft');
          var right = document.getElementById('panoArrowRight');
          if (!left || !right) return;
          left.style.display = '';
          right.style.display = '';
        } catch(e) { /* noop */ }
      }

      // Central helper to set/remove `expanded` class with logging and suppression checks
      function setExpanded(el, on, name) {
        try {
          name = name || (el && el.id) || '(unknown)';
          if (!el) return;
          // If suppression requested and caller wants to open, enforce collapsed and log
          if (on && window.suppressThumbOpen && (name === 'thumbsContainer' || name === 'bottomBar')) {
            console.warn('SUPPRESS: prevented expanding', name, { time: new Date().toISOString(), suppress: !!window.suppressThumbOpen });
            console.trace('suppress prevented expansion for ' + name);
            // ensure collapsed state
            if (!el.classList.contains('collapsed')) el.classList.add('collapsed');
            if (el.classList.contains('expanded')) el.classList.remove('expanded');
            return;
          }
          if (on) {
            if (!el.classList.contains('expanded')) {
              el.classList.add('expanded');
              // If explicitly expanding, ensure collapsed class is removed
              if (el.classList.contains('collapsed')) el.classList.remove('collapsed');
              console.info('setExpanded: added expanded ->', name, { time: new Date().toISOString(), suppress: !!window.suppressThumbOpen });
              console.trace('setExpanded called for ' + name);
            }
          } else {
            if (el.classList.contains('expanded')) el.classList.remove('expanded');
            // when collapsing, ensure collapsed class exists
            if (!el.classList.contains('collapsed')) el.classList.add('collapsed');
            console.info('setExpanded: removed expanded ->', name, { time: new Date().toISOString() });
            console.trace('setCollapsed called for ' + name);
          }
        } catch (e) { console.warn('setExpanded error', e); }
      }

    var thumbsContainer = document.getElementById('thumbsContainer');
    var toggleThumbsBtn = document.getElementById('toggleThumbs');
    if (toggleThumbsBtn && thumbsContainer) {
      var thumbPrev = document.getElementById('thumbPrev');
      var thumbNext = document.getElementById('thumbNext');
      function updateThumbArrows() {
        var collapsed = thumbsContainer.classList.contains('collapsed');
        if (thumbPrev) thumbPrev.style.display = collapsed ? 'none' : '';
        if (thumbNext) thumbNext.style.display = collapsed ? 'none' : '';
        // Ensure pano arrows follow the bottom bar state: only visible when bottom bar is collapsed
        try { if (typeof updatePanoArrowsVisibility === 'function') updatePanoArrowsVisibility(); } catch(e){}
      }
      toggleThumbsBtn.addEventListener('click', function() {
        thumbsContainer.classList.toggle('collapsed');
        toggleThumbsBtn.classList.toggle('active');
        // Sync expanded state and clear suppression when user manually toggles
        var collapsedNow = thumbsContainer.classList.contains('collapsed');
        setExpanded(thumbsContainer, !collapsedNow, 'thumbsContainer');
        try { window.suppressThumbOpen = false; } catch(e){}
        updateThumbArrows();
      });
      // Aggiorna all'avvio
      updateThumbArrows();
    }
  var Marzipano = window.Marzipano;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // DOM Elements
  var panoElement = document.querySelector('#pano');
  var sceneCaptionElement = document.getElementById('sceneCaption');
  var autorotateToggle = document.querySelector('#autorotateToggle');
  var fullscreenToggle = document.querySelector('#fullscreenToggle');
  var languageToggle = document.querySelector('#languageToggle');
  var mapToggle = document.querySelector('#mapToggle');
  var mapModal = document.getElementById('map-modal');
  if (mapToggle && mapModal) {
    mapToggle.addEventListener('click', function() {
      if (mapModal.style.display === 'none' || mapModal.style.display === '') {
        openMapModal();
      } else {
        closeMapModalWithHint();
      }
    });
  }

  // Viewer options
  var viewerOpts = {
    controls: { mouseViewMode: data.settings.mouseViewMode }
  };

  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);
  window.viewer = viewer;
  // Controls (deviceOrientationControlMethod will be created lazily when the user enables gyro)
  var controls = viewer.controls();
  // --- SCENE CREATION ---
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Link Hotspots
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Info Hotspots
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return { data: data, scene: scene, view: view };
  });

  // --- UI LOGIC ---

  // Build Thumbnails
  var thumbsUl = document.getElementById('thumbs');
  scenes.forEach(function(s, idx) {
    var li = document.createElement('li');
    li.className = 'thumb';
    li.setAttribute('data-id', s.data.id);
    
    var img = document.createElement('img');
    img.src = 'tiles/' + s.data.id + '/preview.jpg';
    img.alt = s.data.name;
    
    li.appendChild(img);
    li.addEventListener('click', function() {
      switchScene(s);
    });
    thumbsUl.appendChild(li);
  });

  // Switch Scene Function
  function openMapModal() {
    var modal = document.getElementById('map-modal');
    modal.style.display = 'flex';
    setTimeout(function() {
      modal.classList.add('visible');
      // When the modal finishes its opacity transition, force Leaflet to recalc size.
      function onTrans(e) {
        if (e && e.propertyName && e.propertyName !== 'opacity') return;
        try {
          if (window.debounceInvalidateSize) window.debounceInvalidateSize();
          if (window.mapMap && typeof window.mapMap.invalidateSize === 'function') {
            try { window.mapMap.invalidateSize(); } catch(e){}
          }
        } catch (e) {}
        modal.removeEventListener('transitionend', onTrans);
      }
      modal.addEventListener('transitionend', onTrans);
      // Additional fallback: call invalidate in a double rAF to catch layout quirks
      try {
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ if (window.debounceInvalidateSize) window.debounceInvalidateSize(); }); });
      } catch(e) {}
      // Retry invalidation a few times with delays to handle stubborn layout/paint timing
      [50, 200, 600].forEach(function(ms){
        setTimeout(function(){
          try {
            if (window.debounceInvalidateSize) window.debounceInvalidateSize();
            if (window.mapMap && typeof window.mapMap.invalidateSize === 'function') {
              try { window.mapMap.invalidateSize(true); } catch(e){}
            }
            // call internal resize handler if present
            if (window.mapMap && typeof window.mapMap._onResize === 'function') {
              try { window.mapMap._onResize(); } catch(e){}
            }
          } catch(e){}
        }, ms);
      });
    }, 10);
    // Initialize map only after the modal is visible to avoid creating Leaflet in a 0x0 container
    setTimeout(function(){
      if (!window.mapMap) {
        initMap().then(function() {
          var currentSceneId = scenes[0].data.id;
          try {
            if (viewer && typeof viewer.scene === 'function') {
              var active = viewer.scene();
              for (var si = 0; si < scenes.length; si++) {
                if (scenes[si].scene === active) { currentSceneId = scenes[si].data.id; break; }
              }
            }
          } catch(e) {}
          updateMapMarker(currentSceneId);
          try { setupMapControls(); } catch(e) {}
          // extra invalidate after init
          try { if (window.debounceInvalidateSize) window.debounceInvalidateSize(); } catch(e){}
        }).catch(function(e){ console.warn('initMap failed', e); });
      } else {
        debounceInvalidateSize();
      }
    }, 40);
  }

  function closeMapModalWithHint() {
    var modal = document.getElementById('map-modal');
    modal.classList.remove('visible');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
    var mapToggle = document.getElementById('mapToggle');
    if(mapToggle) {
      mapToggle.classList.add('hint-anim');
      setTimeout(function(){ mapToggle.classList.remove('hint-anim'); }, 2400);
    }
  }

  function switchScene(scene) {
            // Ricollega la linguetta toggle barra panorami
            var bottomBarToggle = document.getElementById('bottomBarToggle');
            var bottomBar = document.getElementById('bottomBar');
                    if (bottomBarToggle && bottomBar && !bottomBarToggle.dataset.bound) {
                        bottomBarToggle.addEventListener('click', function onBottomBarToggle() {
                          bottomBar.classList.toggle('collapsed');
                          var collapsedNow = bottomBar.classList.contains('collapsed');
                          // Use helper to set expanded/collapsed (respects suppression and logs)
                          setExpanded(bottomBar, !collapsedNow, 'bottomBar');
                          // If user explicitly toggles the bar, clear any suppression flag
                          try { window.suppressThumbOpen = false; } catch(e){}
                          setTimeout(function() { try { if (viewer && viewer.resize) viewer.resize(); } catch(e){} }, 420);
                          try { if (typeof updatePanoArrowsVisibility === 'function') updatePanoArrowsVisibility(); } catch(e){}
                        });
                      bottomBarToggle.dataset.bound = '1';
                    }
        // Ricollega i tasti per cambiare panorama
        var thumbPrev = document.getElementById('thumbPrev');
        var thumbNext = document.getElementById('thumbNext');
        if (thumbPrev && !thumbPrev.dataset.bound) {
          thumbPrev.addEventListener('click', function(){ var idx = getCurrentThumbIndex(); var next = (idx - 1 + scenes.length) % scenes.length; switchScene(scenes[next]); });
          thumbPrev.dataset.bound = '1';
        }
        if (thumbNext && !thumbNext.dataset.bound) {
          thumbNext.addEventListener('click', function(){ var idx = getCurrentThumbIndex(); var next = (idx + 1) % scenes.length; switchScene(scenes[next]); });
          thumbNext.dataset.bound = '1';
        }
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateUI(scene);
    updateMapMarker(scene.data.id);

    // Ricollega i controlli della barra panoramica dopo ogni cambio scena
    var viewUpElement = document.querySelector('#viewUp');
    var viewDownElement = document.querySelector('#viewDown');
    var viewLeftElement = document.querySelector('#viewLeft');
    var viewRightElement = document.querySelector('#viewRight');
    var viewInElement = document.querySelector('#viewIn');
    var viewOutElement = document.querySelector('#viewOut');
    var controlsNav = viewer.controls();
    // Deregistra prima i metodi precedenti
    ['upElement','downElement','leftElement','rightElement','inElement','outElement'].forEach(function(name){
      try { controlsNav.unregisterMethod(name); } catch(e){}
    });
    try {
      if (viewUpElement) controlsNav.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -0.7, 3), true);
      if (viewDownElement) controlsNav.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', 0.7, 3), true);
      if (viewLeftElement) controlsNav.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -0.7, 3), true);
      if (viewRightElement) controlsNav.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', 0.7, 3), true);
      if (viewInElement) controlsNav.registerMethod('inElement', new Marzipano.ElementPressControlMethod(viewInElement, 'zoom', -0.7, 3), true);
      if (viewOutElement) controlsNav.registerMethod('outElement', new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom', 0.7, 3), true);
    } catch(e) { console.warn('Error registering control methods', e); }
  }

  function updateUI(scene) {
    // Update Title
    if (sceneCaptionElement) sceneCaptionElement.textContent = scene.data.name;

    // Highlight Thumbnail
    document.querySelectorAll('.thumb').forEach(function(el) {
      if(el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
        el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        el.classList.remove('current');
      }
    });
    // Add diagnostic class to increase gap so lifted thumb doesn't overlap neighbors
    if (thumbsUl) {
      if (document.querySelector('.thumb.current')) thumbsUl.classList.add('has-current');
      else thumbsUl.classList.remove('has-current');
    }

    // Ensure thumbs container allows the lifted thumb to be visible by toggling expanded class
    var thumbsContainerEl = document.getElementById('thumbsContainer');
    if (thumbsContainerEl) {
      if (document.querySelector('.thumb.current')) {
          // Respect global suppress flag (set when navigating via pano arrows)
        var suppressActive = !!window.suppressThumbOpen || (window.suppressThumbOpenUntil && Date.now() < window.suppressThumbOpenUntil);
        if (suppressActive) {
          // keep contracted and reset flag
          setExpanded(thumbsContainerEl, false, 'thumbsContainer');
        } else {
          setExpanded(thumbsContainerEl, true, 'thumbsContainer');
        }
      } else {
        setExpanded(thumbsContainerEl, false, 'thumbsContainer');
      }
    }
    // Also toggle on the bottomBar so overflow is allowed at that level
    var bottomBarEl = document.getElementById('bottomBar');
    if (bottomBarEl) {
      if (document.querySelector('.thumb.current')) {
        // If navigation was triggered by pano arrows, suppress auto-opening the thumbnails/bottom bar
        var suppressActive2 = !!window.suppressThumbOpen || (window.suppressThumbOpenUntil && Date.now() < window.suppressThumbOpenUntil);
        if (suppressActive2) {
          // reset flag and skip expanding
          setExpanded(bottomBarEl, false, 'bottomBar');
          try { window.suppressThumbOpen = false; } catch(e){}
          try { window.suppressThumbOpenUntil = 0; } catch(e){}
        } else {
          setExpanded(bottomBarEl, true, 'bottomBar');
        }
      } else {
        setExpanded(bottomBarEl, false, 'bottomBar');
      }
    }
    // Ensure pano arrows visibility follows the bottom bar state
    try { if (typeof updatePanoArrowsVisibility === 'function') updatePanoArrowsVisibility(); } catch(e){}
  }

  // --- MAP LOGIC (LEAFLET) ---
  window.mapMap = null;
  var mapMarkers = [];
  var baseLayer, satelliteLayer, cartoLayer, layers = [];
  var currentLayerIndex = 0;
  function initMap() {
    if (window.mapMap) return Promise.resolve(); // Già inizializzata

    // Helper: parse EXIF GPS from JPEG ArrayBuffer (returns {lat,lng} or null)
    function getImageGPS(url) {
      return fetch(url).then(function(resp) {
        if (!resp.ok) return null;
        return resp.arrayBuffer();
      }).then(function(buffer) {
        if (!buffer) return null;
        var view = new DataView(buffer);
        // Check SOI
        if (view.getUint16(0) !== 0xFFD8) return null;
        var offset = 2;
       
        while (offset < view.byteLength) {
          var marker = view.getUint16(offset);
          if (marker === 0xFFD9) break; // EOI
          var size = view.getUint16(offset + 2);
          // APP1 (Exif)
          if (marker === 0xFFE1) {
            var start = offset + 4; // start of APP1 payload
            var exifHeader = '';
            for (var i = 0; i < 6; i++) {
              exifHeader += String.fromCharCode(view.getUint8(start + i));
            }
            if (exifHeader !== 'Exif\0\0') { offset += 2 + size; continue; }

            var tiffOffset = start + 6;
            var little = view.getUint16(tiffOffset) === 0x4949;
            var getUint16 = function(off) { return view.getUint16(off, little); };
            var getUint32 = function(off) { return view.getUint32(off, little); };

            var firstIFDOffset = tiffOffset + getUint32(tiffOffset + 4);
            var numEntries = getUint16(firstIFDOffset);
            var gpsIFDPointer = null;
            for (i = 0; i < numEntries; i++) {
              var entryOff = firstIFDOffset + 2 + i * 12;
              var tag = getUint16(entryOff);
              var valueOffset = getUint32(entryOff + 8);
              if (tag === 0x8825) { // GPSInfo tag
                gpsIFDPointer = tiffOffset + valueOffset;
                break;
              }
            }
            if (!gpsIFDPointer) return null;

            var numGpsEntries = getUint16(gpsIFDPointer);
            var latRef, lonRef, lat, lon;
            for (i = 0; i < numGpsEntries; i++) {
              var eOff = gpsIFDPointer + 2 + i * 12;
              var gTag = getUint16(eOff);
              var gType = getUint16(eOff + 2);
              var gCount = getUint32(eOff + 4);
              var gValOff = getUint32(eOff + 8);
              var actualOff = tiffOffset + gValOff;

              if (gTag === 1) { // GPSLatitudeRef (ASCII)
                latRef = '';
                for (var k = 0; k < gCount; k++) latRef += String.fromCharCode(view.getUint8(actualOff + k));
                latRef = latRef.replace(/\0/g, '');
              } else if (gTag === 2) { // GPSLatitude (RATIONAL)
                var dOff = actualOff;
                var degNum = getUint32(dOff);
                var degDen = getUint32(dOff + 4);
                var minNum = getUint32(dOff + 8);
                var minDen = getUint32(dOff + 12);
                var secNum = getUint32(dOff + 16);
                var secDen = getUint32(dOff + 20);
                if (degDen && minDen && secDen) {
                  var deg = degNum / degDen;
                  var min = minNum / minDen;
                  var sec = secNum / secDen;
                  lat = deg + min / 60 + sec / 3600;
                }
              } else if (gTag === 3) { // GPSLongitudeRef
                lonRef = '';
                for (k = 0; k < gCount; k++) lonRef += String.fromCharCode(view.getUint8(actualOff + k));
                lonRef = lonRef.replace(/\0/g, '');
              } else if (gTag === 4) { // GPSLongitude
                dOff = actualOff;
                degNum = getUint32(dOff);
                degDen = getUint32(dOff + 4);
                minNum = getUint32(dOff + 8);
                minDen = getUint32(dOff + 12);
                secNum = getUint32(dOff + 16);
                secDen = getUint32(dOff + 20);
                if (degDen && minDen && secDen) {
                  var ddeg = degNum / degDen;
                  var dmin = minNum / minDen;
                  var dsec = secNum / secDen;
                  lon = ddeg + dmin / 60 + dsec / 3600;
                }
              }
            }
            if (lat !== undefined && lon !== undefined) {
              if (latRef && latRef[0] === 'S') lat = -lat;
              if (lonRef && lonRef[0] === 'W') lon = -lon;
              return { lat: lat, lng: lon };
            }
          }
          offset += 2 + size;
        }
        return null;
      }).catch(function() { return null; });
    }

    // EXIF.js helper copied/adapted: convert GPS rationals to decimal degrees
    function convertToDecimal(ref, deg, min, sec) {
      var toNumber = function(v) {
        // v may be a rational object {numerator, denominator} or a number
        if (v && typeof v === 'object' && ('numerator' in v) && ('denominator' in v)) {
          return v.numerator / v.denominator;
        }
        return Number(v) || 0;
      };
      var d = toNumber(deg);
      var m = toNumber(min);
      var s = toNumber(sec);
      var val = d + (m / 60) + (s / 3600);
      if (ref === 'S' || ref === 'W') val = -val;
      return val;
    }

    // Attempt to read GPS using EXIF.js first (simpler API), fallback to getImageGPS DataView parser
    function getGpsDataEXIF(url) {
      return new Promise(function(resolve) {
        if (!window.EXIF) { resolve(null); return; }
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
          try {
            EXIF.getData(img, function() {
              var lat = EXIF.getTag(this, 'GPSLatitude');
              var lon = EXIF.getTag(this, 'GPSLongitude');
              var latRef = EXIF.getTag(this, 'GPSLatitudeRef');
              var lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
              if (lat && lon) {
                var la = convertToDecimal(latRef, lat[0], lat[1], lat[2]);
                var lo = convertToDecimal(lonRef, lon[0], lon[1], lon[2]);
                resolve({ lat: la, lng: lo });
              } else {
                resolve(null);
              }
            });
          } catch (e) { resolve(null); }
        };
        img.onerror = function() { resolve(null); };
        img.src = url;
      });
    }

    // Build coords array from preview images; fall back to APP_DATA.coordinates or defaults

    // Recupro dati da APP_DATA
    var appCoords = (window.APP_DATA && window.APP_DATA.coordinates) || null;

    var promises = scenes.map(function(s, i) {
      // 1. PRIMA controlliamo se abbiamo già i dati in APP_DATA (data.js)
      // Se ci sono, restituiamo subito una promessa risolta (velocità istantanea)
      if (appCoords && appCoords[i] && typeof appCoords[i].lat === 'number' && typeof appCoords[i].lng === 'number') {
        return Promise.resolve({
          coords: appCoords[i],
          source: 'app_data (fast)'
        });
      }

      // 2. SOLO SE MANCANO, proviamo a scaricare l'immagine e leggere l'EXIF (lento)
      var url = 'tiles/' + s.data.id + '/preview.jpg';
      return getGpsDataEXIF(url).then(function(gps) {
        if (gps) return { coords: gps, source: 'exif' };

        // Tentativo di fallback con il parser binario
        return getImageGPS(url).then(function(gps2) {
          if (gps2) return { coords: gps2, source: 'dataview' };

          // Se fallisce tutto, nessun dato
          return { coords: null, source: 'fallback' };
        });
      });
    });

    return Promise.all(promises).then(function(results) {
      var fallbackLat = 45.765, fallbackLng = 10.812;
      // Build final coords list and record source for diagnostics
      var diagnostics = results.map(function(r, i) {
        var entry = { id: scenes[i].data.id, source: r && r.source ? r.source : 'unknown', lat: null, lng: null };
        if (r && r.coords && typeof r.coords.lat === 'number' && typeof r.coords.lng === 'number') {
          entry.lat = r.coords.lat; entry.lng = r.coords.lng;
        } else if (appCoords && appCoords[i]) {
          entry.source = 'app_data'; entry.lat = appCoords[i].lat; entry.lng = appCoords[i].lng;
        } else {
          entry.source = 'fallback'; entry.lat = fallbackLat + i * 0.0005; entry.lng = fallbackLng + i * 0.0005;
        }
        return entry;
      });

      // If APP_DATA.coordinates exists and length matches scenes, prefer it (explicit choice)
      var useAppCoords = (appCoords && Array.isArray(appCoords) && appCoords.length >= scenes.length);
      if (useAppCoords) {
        console.warn('Using coordinates from APP_DATA.coordinates (present in data). Remove/replace if incorrect.');
      }

      var coords = diagnostics.map(function(d, i) {
        if (useAppCoords) return { lat: appCoords[i].lat, lng: appCoords[i].lng };
        return { lat: d.lat, lng: d.lng };
      });

      // Log diagnostics so user can inspect sources and values
      console.group('Map coordinates diagnostics');
      console.table(diagnostics);
      console.groupEnd();


      window.mapMap = L.map('map-container').setView([coords[0].lat, coords[0].lng], 16);
      var mapMap = window.mapMap;
      // Aggiungi barra di scala
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(mapMap);
      // Define base layers and add default layer
      baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
      satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© ESRI' });
      cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '© CARTO' });
      layers = [baseLayer, satelliteLayer, cartoLayer];
      currentLayerIndex = 0;
      try { layers[currentLayerIndex].addTo(mapMap); } catch(e) { console.warn('adding base layer failed', e); }
      var mapLayerNameEl = document.getElementById('map-layer-name');
      if (mapLayerNameEl) mapLayerNameEl.textContent = (currentLayerIndex === 0 ? 'OSM' : currentLayerIndex === 1 ? 'Satellite' : 'Carto');

      // Create markers for each scene coordinate
      var createIcon = function(active) {
        var color = active ? '#3498db' : '#555';
        var scale = active ? 1.2 : 1;
        return L.divIcon({
          className: 'custom-map-marker',
          html: '<svg viewBox="0 0 24 24" width="30" height="30" style="transform:scale(' + scale + '); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">' +
                '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="' + color + '" stroke="white" stroke-width="2"/>' +
                '<circle cx="12" cy="9" r="2.5" fill="white"/>' +
               '</svg>',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });
      };

      coords.forEach(function(c, i) {
        if (i >= scenes.length) return;
        try {
          var marker = L.marker([c.lat, c.lng], { icon: createIcon(i === 0) }).addTo(mapMap);
          marker.on('click', function() {
            switchScene(scenes[i]);
            try { if (typeof updatePanoArrowsVisibility === 'function') updatePanoArrowsVisibility(); } catch(e){}
          });
          if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
            var popupContent = '<div style="font-size:13px;line-height:1.4;padding:4px 8px;">' +
              '<b>' + scenes[i].data.name + '</b><br>' +
              c.lat.toFixed(6) + ', ' + c.lng.toFixed(6) +
              '</div>';
            marker.bindTooltip(popupContent, { direction: 'top', offset: [0, -32], opacity: 0.95, className: 'custom-marker-tooltip' });
          }
          marker._sceneId = scenes[i].data.id;
          mapMarkers.push({ marker: marker, id: scenes[i].data.id });
        } catch(e) { console.warn('creating marker failed', e); }
      });

      // Pano arrows removed: define noop helpers so other code may still call them safely
      window.suppressThumbOpen = window.suppressThumbOpen || false;
      // ...existing code...
      function updatePanoArrowsVisibility() { /* no-op: arrows removed */ }
    });
  }

  // Change active tile layer by index
  function setLayer(index) {
    if (!mapMap || !layers || !layers.length) return;
    index = (index % layers.length + layers.length) % layers.length;
    if (index === currentLayerIndex) return;
    try { mapMap.removeLayer(layers[currentLayerIndex]); } catch(e){}
    currentLayerIndex = index;
    layers[currentLayerIndex].addTo(mapMap);
    var mapLayerNameEl = document.getElementById('map-layer-name');
    if (mapLayerNameEl) mapLayerNameEl.textContent = (currentLayerIndex === 0 ? 'OSM' : currentLayerIndex === 1 ? 'Satellite' : 'Carto');
    // Sync dropdown if present
    var sel = document.getElementById('map-layer-select');
    if (sel) sel.value = String(currentLayerIndex);
    // Update floating menu active item if present
    var items = document.querySelectorAll('#map-controls-menu .map-controls-item');
    items.forEach(function(it) {
      var idx = parseInt(it.getAttribute('data-index'), 10);
      if (idx === currentLayerIndex) it.classList.add('active'); else it.classList.remove('active');
    });
  }

  function toggleLayer() { setLayer(currentLayerIndex + 1); }
  // Expose to global for UI buttons in HTML
  window.setLayer = setLayer;
  window.toggleLayer = toggleLayer;
  // Fit map view to include all markers
  function fitAllMarkers() {
    if (!mapMap || !mapMarkers || !mapMarkers.length) return;
    var group = new L.featureGroup(mapMarkers.map(function(o) { return o.marker; }));
    try {
      mapMap.fitBounds(group.getBounds(), { padding: [60, 60], animate: true });
    } catch (e) { console.warn('fitAllMarkers failed', e); }
  }
  window.fitAllMarkers = fitAllMarkers;

  // Setup floating map controls (menu) — localized labels and event bindings
  var _mapControlsInitialized = false;
  function setupMapControls() {
    if (_mapControlsInitialized) return;
    _mapControlsInitialized = true;
    var fitBtn = document.getElementById('map-controls-fit');
    var cycleBtn = document.getElementById('map-controls-cycle');

    if (fitBtn) fitBtn.addEventListener('click', function() { fitAllMarkers(); });
    if (cycleBtn) cycleBtn.addEventListener('click', function() { toggleLayer(); });
    setLayer(currentLayerIndex);
  }
  window.setupMapControls = setupMapControls;

  function updateMapMarker(sceneId) {
    if (!mapMap) return;
    var coordsText = '';
    mapMarkers.forEach(function(obj) {
      var isActive = (obj.id === sceneId);
      // Ricrea icona basandosi sullo stato attivo
      var color = isActive ? '#3498db' : '#555';
      var html = `<svg viewBox="0 0 24 24" width="30" height="30" style="transform:scale(${isActive?1.3:1}); transition:all 0.3s;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
               </svg>`;
      var icon = L.divIcon({ className: '', html: html, iconSize:[30,30], iconAnchor:[15,30] });
      obj.marker.setIcon(icon);
      if(isActive) {
        var latlng = obj.marker.getLatLng();
        coordsText = latlng.lat.toFixed(6) + ', ' + latlng.lng.toFixed(6);
        try { mapMap.setView(latlng, Math.max(mapMap.getZoom(), 16), { animate: true }); } catch(e) {}
        try { obj.marker.openPopup(); } catch(e) {}
      }
    });
    var coordsEl = document.getElementById('map-coords');
    if (coordsEl) coordsEl.textContent = coordsText;
  }

  // Map Toggle Handler
  if (mapToggle) {
    mapToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      openMapModal();
    });
  }

  // Chiudi la mappa al primo click su altri controlli
  function setupAutoCloseMapModal() {
    var modal = document.getElementById('map-modal');
    function handler(e) {
      if (!modal.classList.contains('visible')) return;
      // Se il click non è dentro la mappa o sui controlli mappa
      if (!modal.contains(e.target) && e.target.id !== 'mapToggle') {
        closeMapModalWithHint();
        document.removeEventListener('mousedown', handler, true);
      }
      // Se clicco su un controllo esterno, chiudi
      if (e.target.closest && !e.target.closest('.modal-content') && e.target.id !== 'mapToggle') {
        closeMapModalWithHint();
        document.removeEventListener('mousedown', handler, true);
      }
    }
    document.addEventListener('mousedown', handler, true);
  }



  // Carica subito il primo panorama all'avvio e lascia la mappa sempre aperta
  window.addEventListener('DOMContentLoaded', function() {
    switchScene(scenes[0]);
    try { if (typeof updatePanoArrowsVisibility === 'function') updatePanoArrowsVisibility(); } catch(e){}
    // Debug: observe bottomBar and thumbsContainer class changes to trace unexpected expansions
    try {
      var _bb = document.getElementById('bottomBar');
      if (_bb && !window._bottomBarDebugObserver) {
        var mo = new MutationObserver(function(records){
          records.forEach(function(r){
            if (r.attributeName === 'class') {
              var prev = r.oldValue || '(none)';
              var now = _bb.className || '(none)';
              if (_bb.classList.contains('expanded')) {
                console.warn('DEBUG: bottomBar gained expanded', { time: new Date().toISOString(), prev: prev, now: now });
                console.trace('bottomBar expanded stack');
              } else {
                console.info('DEBUG: bottomBar class changed', { time: new Date().toISOString(), prev: prev, now: now });
              }
            }
          });
        });
        mo.observe(_bb, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
        window._bottomBarDebugObserver = mo;
      }
      var _tc = document.getElementById('thumbsContainer');
      if (_tc && !window._thumbsContainerDebugObserver) {
        var mo2 = new MutationObserver(function(records){
          records.forEach(function(r){
            if (r.attributeName === 'class') {
              var prev = r.oldValue || '(none)';
              var now = _tc.className || '(none)';
              if (_tc.classList.contains('expanded')) {
                console.warn('DEBUG: thumbsContainer gained expanded', { time: new Date().toISOString(), prev: prev, now: now });
                console.trace('thumbsContainer expanded stack');
              } else {
                console.info('DEBUG: thumbsContainer class changed', { time: new Date().toISOString(), prev: prev, now: now });
              }
            }
          });
        });
        mo2.observe(_tc, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
        window._thumbsContainerDebugObserver = mo2;
      }
    } catch(e) { console.warn('Debug observer setup failed', e); }
    // Re-enable automatic map opening on desktop: open at startup
    try { if (!isMobileScreen()) openMapModal(); } catch(e) {}
  });

  // Re-open the map on every scene change on desktop (if desktop, always open)
  try {
    var origSwitchScene = switchScene;
    switchScene = function(scene) {
      origSwitchScene(scene);
      try { if (!isMobileScreen()) openMapModal(); } catch(e) {}
    };
  } catch(e) {}

  window.closeMapModal = function() {
    // Chiudi la mappa, ma al prossimo cambio scena si riaprirà
    var modal = document.getElementById('map-modal');
    modal.classList.remove('visible');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
    // Effetto animazione sul tasto mappa
    var mapBtn = document.getElementById('mapToggle');
    if(mapBtn) {
      mapBtn.classList.add('hint-anim');
      setTimeout(function(){ mapBtn.classList.remove('hint-anim'); }, 2400);
    }
  };

  // --- HOTSPOT CREATION ---

  function createLinkHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('link-hotspot');
    var icon = document.createElement('img');
    icon.src = 'img/link.png'; // Assicurati di avere questa icona
    icon.style.width = '100%'; icon.style.height = '100%';
    
    // Rotazione
    icon.style.transform = 'rotate(' + hotspot.rotation + 'rad)';
    
    wrapper.appendChild(icon);
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });
    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.className = 'hotspot-info';
    var span = document.createElement('span');
    span.className = 'hotspot-plus';
    span.textContent = 'i';
    wrapper.appendChild(span);
    wrapper.addEventListener('click', function(e) {
      e.stopPropagation();
      showInfoHotspot(
        getBilingualText(hotspot.title),
        getBilingualText(hotspot.text),
        hotspot.image || null
      );
    });
    return wrapper;
  }

  // --- INFO MODAL LOGIC ---
  function openCustomModal(hotspot) {
    var modal = document.getElementById('custom-hotspot-modal');
    var titleEl = document.getElementById('modal-title');
    var bodyEl = document.getElementById('modal-body');

    titleEl.textContent = getBilingualText(hotspot.title);
    
    var text = getBilingualText(hotspot.text);
    var htmlContent = '<p>' + text + '</p>';
    if (hotspot.image) {
      htmlContent = '<img src="' + hotspot.image + '" alt="img">' + htmlContent;
    }
    
    bodyEl.innerHTML = htmlContent;
    modal.style.display = 'flex';
    setTimeout(function() { modal.classList.add('visible'); }, 10);
    stopAutorotate();
  }

  window.closeCustomModal = function() {
    var modal = document.getElementById('custom-hotspot-modal');
    modal.classList.remove('visible');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
    if (autorotateToggle.classList.contains('active')) startAutorotate();
  };

  // --- HELPERS ---
  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) return scenes[i];
    }
    return null;
  }

  // Autorotate logic
  var autorotate = Marzipano.autorotate({ yawSpeed: 0.03, targetPitch: 0, targetFov: Math.PI/2 });
  
  function startAutorotate() {
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
    autorotateToggle.classList.add('active');
    autorotateToggle.querySelector('.icon-play').style.display = 'none';
    autorotateToggle.querySelector('.icon-pause').style.display = 'block';
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
    autorotateToggle.classList.remove('active');
    autorotateToggle.querySelector('.icon-play').style.display = 'block';
    autorotateToggle.querySelector('.icon-pause').style.display = 'none';
  }

  autorotateToggle.addEventListener('click', function() {
    if (autorotateToggle.classList.contains('active')) stopAutorotate();
    else startAutorotate();
  });

  // Fullscreen logic
  if (screenfull.enabled) {
    // Mostra solo su desktop, nascondi su mobile anche su Safari/iOS
    var isMobile = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches || /iPhone|iPad|iPod/i.test(navigator.userAgent);
    var fullscreenBtn = document.getElementById('fullscreenToggle');
    if(isMobile) {
      if(fullscreenBtn) {
        fullscreenBtn.style.display = 'none';
        fullscreenBtn.style.visibility = 'hidden';
        fullscreenBtn.style.opacity = '0';
        fullscreenBtn.style.height = '0';
      }
      // NOTE: We intentionally do NOT hide the gyro button here — it's controlled elsewhere and
      // requires user interaction on mobile (iOS permission flow). Hiding it would prevent users
      // from granting DeviceOrientation permission.
    } else {
      if(fullscreenBtn) {
        fullscreenBtn.style.display = 'inline-flex';
        fullscreenBtn.style.visibility = 'visible';
        fullscreenBtn.style.opacity = '1';
        fullscreenBtn.style.height = 'auto';
      }
      var gyroBtnElement = document.getElementById('gyroToggle');
      if(gyroBtnElement) {
        gyroBtnElement.style.display = 'none';
        gyroBtnElement.style.visibility = 'hidden';
        gyroBtnElement.style.opacity = '0';
        gyroBtnElement.style.height = '0';
      }
      fullscreenToggle.addEventListener('click', function() { screenfull.toggle(); });
      screenfull.on('change', function() {
         if(screenfull.isFullscreen) {
           fullscreenToggle.querySelector('.icon-fs-on').style.display = 'none';
           fullscreenToggle.querySelector('.icon-fs-off').style.display = 'block';
         } else {
           fullscreenToggle.querySelector('.icon-fs-on').style.display = 'block';
           fullscreenToggle.querySelector('.icon-fs-off').style.display = 'none';
         }
      });
    }
  }

  // Language Toggle
  if (languageToggle) {
    function updateLangSwitchUI() {
      var lang = localStorage.getItem('tourLanguage') || 'it';
      var it = languageToggle.querySelector('.lang-it');
      var en = languageToggle.querySelector('.lang-en');
      languageToggle.classList.remove('it', 'en');
      languageToggle.classList.add(lang);
      if (it) { if (lang === 'it') it.classList.add('active'); else it.classList.remove('active'); }
      if (en) { if (lang === 'en') en.classList.add('active'); else en.classList.remove('active'); }
      // Also update simple label/flag if present
      try {
        var lbl = document.getElementById('lang-label');
        var flg = document.getElementById('lang-flag');
        if (lbl) lbl.textContent = (lang === 'it') ? 'IT' : 'EN';
        if (flg) {
          if (flg.tagName === 'IMG') flg.src = (lang === 'it') ? 'img/flag-it.svg' : 'img/flag-en.svg';
          else flg.textContent = (lang === 'it') ? '🇮🇹' : '🇬🇧';
        }
      } catch(e) {}
    }
    languageToggle.addEventListener('click', function(e) {
      var lang = localStorage.getItem('tourLanguage') || 'it';
      var newLang = lang === 'en' ? 'it' : 'en';
      setLanguage(newLang);
      updateLangSwitchUI();
      // Aggiorna titolo scena corrente
      var currentSceneName = null;
      try {
        if (viewer && typeof viewer.scene === 'function') {
          var activeS = viewer.scene();
          for (var j = 0; j < scenes.length; j++) {
            if (scenes[j].scene === activeS) { currentSceneName = scenes[j].data.name; break; }
          }
        }
      } catch(e) {}
      if (currentSceneName && sceneCaptionElement) sceneCaptionElement.textContent = currentSceneName;
    });
    // Inizializza lo stato visivo
    updateLangSwitchUI();
  }

  // --- NAVIGATION CONTROLS LOGIC ---
  
  // Elementi DOM
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');
  var bottomBarToggle = document.querySelector('#bottomBarToggle');
  var bottomBar = document.querySelector('#bottomBar');

  // Configurazione velocità movimento
  var velocity = 0.7;
  var friction = 3;

  // Collega i pulsanti al viewer Marzipano
  var controlsNav = viewer.controls();
  
  // Registra i metodi di controllo solo se gli elementi esistono
  if (viewUpElement) controlsNav.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -velocity, friction), true);
  if (viewDownElement) controlsNav.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', velocity, friction), true);
  if (viewLeftElement) controlsNav.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -velocity, friction), true);
  if (viewRightElement) controlsNav.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', velocity, friction), true);
  if (viewInElement) controlsNav.registerMethod('inElement', new Marzipano.ElementPressControlMethod(viewInElement, 'zoom', -velocity, friction), true);
  if (viewOutElement) controlsNav.registerMethod('outElement', new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom', velocity, friction), true);

  // --- TOGGLE BAR LOGIC ---
  if (bottomBarToggle && bottomBar) {
    bottomBarToggle.addEventListener('click', function onBottomBarToggleLocal(e) {
      if (e && e.stopPropagation) { e.stopPropagation(); e.preventDefault(); }
      bottomBar.classList.toggle('collapsed');
      var collapsedNow = bottomBar.classList.contains('collapsed');
      setExpanded(bottomBar, !collapsedNow, 'bottomBar');
      try { window.suppressThumbOpen = false; } catch(e){}
      // Forza un resize del viewer se la dimensione della canvas cambia
      setTimeout(function() { if (viewer && viewer.resize) viewer.resize(); }, 420);
      try { if (typeof updatePanoArrowsVisibility === 'function') updatePanoArrowsVisibility(); } catch(e){}
    });
    // mark as bound so other attachers (e.g., switchScene) won't add duplicates
    try { bottomBarToggle.dataset.bound = '1'; } catch(e){}
  }

  // --- THUMBNAIL SIDE ARROWS (prev/next) ---
  var thumbPrev = document.getElementById('thumbPrev');
  var thumbNext = document.getElementById('thumbNext');

  function getCurrentThumbIndex() {
    var current = document.querySelector('.thumb.current');
    if (!current) return 0;
    var id = current.getAttribute('data-id');
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) return i;
    }
    return 0;
  }

  // Initial setup
  switchScene(scenes[0]);

  // --- IN-PAGE LOGGER: capture console + errors and provide download ---
  (function setupInPageLogger() {
    try {
      var __LOG_BUFFER = [];
      var __LOG_MAX = 5000;

      function pushLog(level, args) {
        try {
          var parts = Array.prototype.slice.call(args).map(function(a) {
            try {
              if (typeof a === 'object') return JSON.stringify(a);
              return String(a);
            } catch (e) { return String(a); }
          });
          var entry = { time: new Date().toISOString(), level: level, message: parts.join(' ') };
          __LOG_BUFFER.push(entry);
          if (__LOG_BUFFER.length > __LOG_MAX) __LOG_BUFFER.shift();
        } catch (e) {}
      }

      // Wrap console methods
      ['log','info','warn','error','debug'].forEach(function(level) {
        try {
          var orig = console[level] && console[level].bind ? console[level].bind(console) : console[level];
          console[level] = function() {
            try { pushLog(level, arguments); } catch(e){}
            if (orig) try { orig.apply(console, arguments); } catch(e){}
          };
        } catch(e){}
      });

      window.addEventListener('error', function(ev) {
        try { pushLog('error', [ev.message + ' @' + (ev.filename || '') + ':' + (ev.lineno||'') + ':' + (ev.colno||'')]); } catch(e){}
      }, true);
      window.addEventListener('unhandledrejection', function(ev) {
        try { pushLog('error', ['UnhandledRejection', ev.reason]); } catch(e){}
      }, true);

      function downloadLogs() {
        try {
          var text = __LOG_BUFFER.map(function(e){ return '['+e.time+'] '+e.level.toUpperCase()+': '+e.message; }).join('\n');
          var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'tour-logs-'+(new Date().toISOString().replace(/[:.]/g,'-'))+'.txt';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 5000);
          showLogToast('Log scaricati');
        } catch(e) { console.error('downloadLogs failed', e); }
      }

      function showLogToast(msg) {
        try {
          var t = document.getElementById('log-toast');
          if (!t) {
            t = document.createElement('div'); t.id = 'log-toast';
            t.style.position = 'fixed'; t.style.right = '12px'; t.style.bottom = '12px'; t.style.background = 'rgba(0,0,0,0.8)';
            t.style.color = '#fff'; t.style.padding = '8px 12px'; t.style.borderRadius = '8px'; t.style.zIndex = 30000; t.style.fontSize = '13px';
            document.body.appendChild(t);
          }
          t.textContent = msg;
          t.style.opacity = '1';
          setTimeout(function(){ try { t.style.transition = 'opacity 400ms'; t.style.opacity = '0'; } catch(e){} }, 1600);
        } catch(e){}
      }

      // Expose globally so it can be called programmatically or by the button
      window.downloadLogs = downloadLogs;

      // Wire button if present
      try {
        var logBtn = document.getElementById('downloadLogs');
        if (logBtn && !logBtn.dataset.bound) {
          logBtn.addEventListener('click', function(e){ if (e && e.preventDefault) e.preventDefault(); downloadLogs(); });
          logBtn.dataset.bound = '1';
        }
      } catch(e){}
    } catch(e) { console.warn('in-page logger init failed', e); }
  })();

})();