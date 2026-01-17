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
    `;
    var style = document.createElement('style'); style.appendChild(document.createTextNode(css)); document.head.appendChild(style);
    modal.querySelector('#info-close').addEventListener('click', hideInfoHotspot);
    modal.querySelector('#info-backdrop')?.addEventListener('click', hideInfoHotspot);
    document.addEventListener('keydown', function onEsc(e){ if (e.key === 'Escape') hideInfoHotspot(); });
  }
  document.getElementById('info-title').innerText = title || '';
  document.getElementById('info-body').innerText = text || '';
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

(function() {
  var Marzipano = window.Marzipano;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // DOM Elements
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('.sceneName');
  var autorotateToggle = document.querySelector('#autorotateToggle');
  var fullscreenToggle = document.querySelector('#fullscreenToggle');
  var languageToggle = document.querySelector('#languageToggle');
  var mapToggle = document.querySelector('#mapToggle');

  // Viewer options
  var viewerOpts = {
    controls: { mouseViewMode: data.settings.mouseViewMode }
  };

  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);
  
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
    setTimeout(function() { modal.classList.add('visible'); }, 10);
    if (!mapMap) {
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
      });
    } else {
      setTimeout(function(){ mapMap.invalidateSize(); }, 200);
    }
  }

  function closeMapModalWithHint() {
    var modal = document.getElementById('map-modal');
    modal.classList.remove('visible');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
      // Removed the logic that applies the map-hint-ring class
      // var mapToggle = document.getElementById('mapToggle');
      // if(mapToggle) {
      //   mapToggle.classList.add('hint-anim');
      //   setTimeout(function(){ mapToggle.classList.remove('hint-anim'); }, 1200);
      // }
  }

  function switchScene(scene) {
            // Ricollega la linguetta toggle barra panorami
            var bottomBarToggle = document.getElementById('bottomBarToggle');
            var bottomBar = document.getElementById('bottomBar');
            if (bottomBarToggle && bottomBar) {
              bottomBarToggle.onclick = function() {
                bottomBar.classList.toggle('collapsed');
                setTimeout(function() { if (viewer && viewer.resize) viewer.resize(); }, 420);
              };
            }
        // Ricollega i tasti per cambiare panorama
        var thumbPrev = document.getElementById('thumbPrev');
        var thumbNext = document.getElementById('thumbNext');
        if (thumbPrev) {
          thumbPrev.onclick = function() {
            var idx = getCurrentThumbIndex();
            var next = (idx - 1 + scenes.length) % scenes.length;
            switchScene(scenes[next]);
          };
        }
        if (thumbNext) {
          thumbNext.onclick = function() {
            var idx = getCurrentThumbIndex();
            var next = (idx + 1) % scenes.length;
            switchScene(scenes[next]);
          };
        }
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateUI(scene);
    updateMapMarker(scene.data.id);
    openMapModal(); // Apri la mappa ad ogni cambio panorama

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
    if (viewUpElement) controlsNav.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -0.7, 3), true);
    if (viewDownElement) controlsNav.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', 0.7, 3), true);
    if (viewLeftElement) controlsNav.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -0.7, 3), true);
    if (viewRightElement) controlsNav.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', 0.7, 3), true);
    if (viewInElement) controlsNav.registerMethod('inElement', new Marzipano.ElementPressControlMethod(viewInElement, 'zoom', -0.7, 3), true);
    if (viewOutElement) controlsNav.registerMethod('outElement', new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom', 0.7, 3), true);
  }

  function updateUI(scene) {
    // Update Title
    sceneNameElement.textContent = scene.data.name;

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
      if (document.querySelector('.thumb.current')) thumbsContainerEl.classList.add('expanded');
      else thumbsContainerEl.classList.remove('expanded');
    }
    // Also toggle on the bottomBar so overflow is allowed at that level
    var bottomBarEl = document.getElementById('bottomBar');
    if (bottomBarEl) {
      if (document.querySelector('.thumb.current')) bottomBarEl.classList.add('expanded');
      else bottomBarEl.classList.remove('expanded');
    }
  }

  // --- MAP LOGIC (LEAFLET) ---
  var mapMap = null;
  var mapMarkers = [];
  var baseLayer, satelliteLayer, cartoLayer, layers = [];
  var currentLayerIndex = 0;
  function initMap() {
    if (mapMap) return Promise.resolve(); // Già inizializzata

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
       
        while (offset < length) {
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
    var appCoords = (window.APP_DATA && window.APP_DATA.coordinates) || null;
    var promises = scenes.map(function(s, i) {
      var url = 'tiles/' + s.data.id + '/preview.jpg';
      return getGpsDataEXIF(url).then(function(gps) {
        if (gps) return { coords: gps, source: 'exif' };
        return getImageGPS(url).then(function(gps2) {
          if (gps2) return { coords: gps2, source: 'dataview' };
          if (appCoords && appCoords[i]) return { coords: appCoords[i], source: 'app_data' };
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


      mapMap = L.map('map-container').setView([coords[0].lat, coords[0].lng], 16);
      // Aggiungi barra di scala
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(mapMap);

      // Define base layers
      baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      });
      satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© ESRI'
      });
      cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '© CARTO'
      });

      layers = [baseLayer, satelliteLayer, cartoLayer];
      currentLayerIndex = 0;
      layers[currentLayerIndex].addTo(mapMap);
      var mapLayerNameEl = document.getElementById('map-layer-name');
      if (mapLayerNameEl) mapLayerNameEl.textContent = (currentLayerIndex === 0 ? 'OSM' : currentLayerIndex === 1 ? 'Satellite' : 'Carto');

      // Crea icone personalizzate
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
        var marker = L.marker([c.lat, c.lng], { icon: createIcon(i === 0) }).addTo(mapMap);
        marker.on('click', function() {
          switchScene(scenes[i]);
          closeMapModal();
        });
        // Attach popup with coordinates (mostra su hover)
        if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
          var popupContent = '<div style="font-size:13px;line-height:1.4;padding:4px 8px;">'
            + '<b>' + scenes[i].data.name + '</b><br>'
            + c.lat.toFixed(6) + ', ' + c.lng.toFixed(6)
            + '</div>';
          marker.bindTooltip(popupContent, {direction:'top',offset:[0,-32],opacity:0.95,className:'custom-marker-tooltip'});
        }
        marker._sceneId = scenes[i].data.id;
        mapMarkers.push({ marker: marker, id: scenes[i].data.id });
      });
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
    var modal = document.getElementById('map-modal');
    modal.style.display = 'flex';
    setTimeout(function() { modal.classList.add('visible'); }, 10);
  });


  // Apri la mappa ad ogni cambio panorama e assicurati che resti aperta
  var origSwitchScene = switchScene;
  switchScene = function(scene) {
    origSwitchScene(scene);
    var modal = document.getElementById('map-modal');
    modal.style.display = 'flex';
    setTimeout(function() { modal.classList.add('visible'); }, 10);
  };

  window.closeMapModal = function() {
    // Chiudi la mappa, ma al prossimo cambio scena si riaprirà
    var modal = document.getElementById('map-modal');
    modal.classList.remove('visible');
    setTimeout(function() { modal.style.display = 'none'; }, 300);
    // Effetto anello sul tasto mappa
    var mapBtn = document.getElementById('mapToggle');
    if(mapBtn) {
      mapBtn.classList.add('map-hint-ring');
      setTimeout(function(){ mapBtn.classList.remove('map-hint-ring'); }, 1400);
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
    var vrBtn = document.getElementById('vrToggle');
    if(isMobile) {
      if(fullscreenBtn) {
        fullscreenBtn.style.display = 'none';
        fullscreenBtn.style.visibility = 'hidden';
        fullscreenBtn.style.opacity = '0';
        fullscreenBtn.style.height = '0';
      }
      if(vrBtn) {
        vrBtn.style.display = 'inline-flex';
        vrBtn.style.visibility = 'visible';
        vrBtn.style.opacity = '1';
        vrBtn.style.height = 'auto';
      }
    } else {
      if(fullscreenBtn) {
        fullscreenBtn.style.display = 'inline-flex';
        fullscreenBtn.style.visibility = 'visible';
        fullscreenBtn.style.opacity = '1';
        fullscreenBtn.style.height = 'auto';
      }
      if(vrBtn) {
        vrBtn.style.display = 'none';
        vrBtn.style.visibility = 'hidden';
        vrBtn.style.opacity = '0';
        vrBtn.style.height = '0';
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
    // Modalità visore: solo mobile, placeholder (da integrare con WebXR/VR se serve)
    var vrToggle = document.getElementById('vrToggle');
    if(vrToggle) {
      vrToggle.addEventListener('click', function() {
        alert('Modalità visore attivata! (Qui puoi integrare WebXR/VR)');
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
      if (lang === 'it') {
        it.classList.add('active');
        en.classList.remove('active');
      } else {
        en.classList.add('active');
        it.classList.remove('active');
      }
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
      if (currentSceneName) sceneNameElement.textContent = currentSceneName;
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
    bottomBarToggle.addEventListener('click', function() {
      bottomBar.classList.toggle('collapsed');
      // Forza un resize del viewer se la dimensione della canvas cambia
      setTimeout(function() { if (viewer && viewer.resize) viewer.resize(); }, 420);
    });
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

  if (thumbPrev) {
    thumbPrev.addEventListener('click', function() {
      var idx = getCurrentThumbIndex();
      var next = (idx - 1 + scenes.length) % scenes.length;
      switchScene(scenes[next]);
    });
  }
  if (thumbNext) {
    thumbNext.addEventListener('click', function() {
      var idx = getCurrentThumbIndex();
      var next = (idx + 1) % scenes.length;
      switchScene(scenes[next]);
    });
  }

  // Initial setup
  switchScene(scenes[0]);

})();