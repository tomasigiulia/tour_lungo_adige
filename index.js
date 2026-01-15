/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#topBar .sceneName') || document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var languageToggleElement = document.querySelector('#languageToggle');
  var mapToggleElement = document.getElementById('mapToggle');

  // Language toggle handler
  if (languageToggleElement) {
    languageToggleElement.addEventListener('click', function() {
      // Cambia lingua
      currentLanguage = currentLanguage === 'it' ? 'en' : 'it';
      setLanguage(currentLanguage);
      
      // Aggiorna il testo del pulsante
      var langText = languageToggleElement.querySelector('.lang-text');
      if (langText) {
        langText.textContent = currentLanguage.toUpperCase();
      }
    });
  }

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
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

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots.
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {
    // Crea hotspot con design originale (icona info grigia)
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = getBilingualText(hotspot.title);
    titleWrapper.appendChild(title);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);

    // Place header into wrapper element.
    wrapper.appendChild(header);

    // Click handler per aprire la modale personalizzata
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      openCustomModal(hotspot);
    });

    // Previeni eventi di propagazione
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Funzione per aprire la modale personalizzata
  function openCustomModal(hotspot) {
    var modal = document.getElementById('custom-hotspot-modal');
    var modalTitle = document.getElementById('modal-title');
    var modalBody = document.getElementById('modal-body');

    if (!modal || !modalTitle || !modalBody) return;

    // Ottieni testo nella lingua corrente
    var title = getBilingualText(hotspot.title);
    var text = getBilingualText(hotspot.text);

    // Imposta il contenuto
    modalTitle.textContent = title;

    // Costruisci il body con testo a sinistra e immagine a destra
    var bodyContent = '<div class="modal-body-text"><p>' + text + '</p></div>';
    if (hotspot.image) {
      bodyContent += '<div class="modal-body-image"><img src="' + hotspot.image + '" alt="' + title + '" onerror="this.parentElement.style.display=\'none\';"></div>';
    }

    modalBody.innerHTML = bodyContent;

    // Mostra la modale
    modal.classList.add('visible');

    // Ferma autorotazione quando la modale è aperta
    stopAutorotate();
  }

  // Funzione per chiudere la modale (disponibile globalmente)
  window.closeCustomModal = function() {
    var modal = document.getElementById('custom-hotspot-modal');
    if (modal) {
      modal.classList.remove('visible');
      // Riprendi autorotazione se era abilitata
      if (autorotateToggleElement.classList.contains('enabled')) {
        startAutorotate();
      }
    }
  };

  // Chiudi modale cliccando fuori
  // Chiudi solo la modale hotspot cliccando fuori, NON la mappa
  document.addEventListener('click', function(e) {
    var modal = document.getElementById('custom-hotspot-modal');
    if (modal && e.target === modal) {
      closeCustomModal();
    }
  });

  // Chiudi modale con tasto ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      closeCustomModal();
    }
  });

  // Logica per aprire/chiudere la modale mappa
  if (mapToggleElement) {
    mapToggleElement.addEventListener('click', function() {
      var modal = document.getElementById('map-modal');
      if (modal) {
        modal.style.display = 'flex';
        setTimeout(function() {
          var mapDiv = document.getElementById('map-container');
          if (window._leafletMap && mapDiv) {
            try { window._leafletMap.remove(); } catch(e) {}
            window._leafletMap = null;
          }
          var coords = (window.APP_DATA && window.APP_DATA.coordinates) || [
            { lat: 45.2213333333333, lng: 11.2943416666667 },
            { lat: 45.2208555555556, lng: 11.2942472222222 },
            { lat: 45.1443555555556, lng: 12.300925 }
          ];
          var map = L.map('map-container').setView([coords[0].lat, coords[0].lng], 13);
          // Definisci i layer
          var baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
          var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri' });
          var cartoLayer = L.tileLayer('https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '© CartoDB' });
          var layers = [baseLayer, satelliteLayer, cartoLayer];
          var layerNames = ["OpenStreetMap", "Satellite Esri", "CartoDB"];
          var currentLayer = 0;
          layers[currentLayer].addTo(map);
          // Aggiorna nome layer
          var layerNameEl = document.getElementById('map-layer-name');
          if (layerNameEl) layerNameEl.textContent = layerNames[currentLayer];
          // Marker panorami
          // Icona goccia classica SVG
          function getMarkerIcon(isActive) {
            return L.divIcon({
              className: '',
              html: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3C10.477 3 6 7.477 6 13c0 7.5 9.5 15.5 9.5 15.5s9.5-8 9.5-15.5c0-5.523-4.477-10-10-10Z" fill="${isActive ? '#27ae60' : '#3498db'}" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="13" r="4" fill="white"/>
              </svg>`,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });
          }

          var markers = coords.map(function(coord, i) {
            var isActive = (window._leafletMap && window._leafletMap._activeIndex === i) || i === 0;
            var marker = L.marker([coord.lat, coord.lng], { icon: getMarkerIcon(isActive) }).addTo(map);
            var panoName = (window.APP_DATA && window.APP_DATA.scenes && window.APP_DATA.scenes[i] && window.APP_DATA.scenes[i].name) ? window.APP_DATA.scenes[i].name : 'Panorama ' + (i+1);
            marker.bindPopup(panoName);
            marker.on('click', function() {
              // Cambia la vista al panorama relativo
              var el = document.querySelector('#sceneList .scene[data-id="' + window.APP_DATA.scenes[i].id + '"]');
              if (el) el.click();
              // Aggiorna marker attivo
              markers.forEach(function(m, idx) {
                m.setIcon(getMarkerIcon(idx === i));
              });
              map._activeIndex = i;
            });
            return marker;
          });

          // Aggiorna marker attivo quando si cambia panorama dalla lista
          document.querySelectorAll('#sceneList .scene').forEach(function(el, idx) {
            el.addEventListener('click', function() {
              markers.forEach(function(m, i) {
                m.setIcon(getMarkerIcon(i === idx));
              });
              map._activeIndex = idx;
            });
          });

          // Controllo custom: cambio layer
          var LayerControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd: function(map) {
              var btn = L.DomUtil.create('button', 'leaflet-control-custom');
              btn.title = 'Cambia layer';
              btn.style.background = '#3498db';
              btn.style.border = 'none';
              btn.style.borderRadius = '6px';
              btn.style.width = '40px';
              btn.style.height = '40px';
              btn.style.display = 'flex';
              btn.style.alignItems = 'center';
              btn.style.justifyContent = 'center';
              btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 17L10 14L14 17L20 14V7L14 10L10 7L4 10V17Z" stroke="white" stroke-width="2" fill="#3498db"/><path d="M4 10L10 13L14 10L20 13" stroke="white" stroke-width="2"/><path d="M10 13V7" stroke="white" stroke-width="2"/><path d="M14 10V17" stroke="white" stroke-width="2"/></svg>';
              L.DomEvent.on(btn, 'click', function(e) {
                map.removeLayer(layers[currentLayer]);
                currentLayer = (currentLayer + 1) % layers.length;
                layers[currentLayer].addTo(map);
                // Aggiorna nome layer
                var layerNameEl = document.getElementById('map-layer-name');
                if (layerNameEl) layerNameEl.textContent = layerNames[currentLayer];
                L.DomEvent.stopPropagation(e);
              });
              return btn;
            }
          });
                    // Aggiorna coordinate della vista
                    var coordsEl = document.getElementById('map-coords');
                    function updateCoords() {
                      if (coordsEl && map) {
                        var c = map.getCenter();
                        // Trova il panorama più vicino al centro
                        var minDist = Infinity, panoName = '';
                        coords.forEach(function(coord, i) {
                          var dist = Math.sqrt(Math.pow(coord.lat - c.lat, 2) + Math.pow(coord.lng - c.lng, 2));
                          if (dist < minDist) {
                            minDist = dist;
                            panoName = (window.APP_DATA && window.APP_DATA.scenes && window.APP_DATA.scenes[i] && window.APP_DATA.scenes[i].name) ? window.APP_DATA.scenes[i].name : 'Panorama ' + (i+1);
                          }
                        });
                        coordsEl.textContent = panoName + ': ' + c.lat.toFixed(5) + ', ' + c.lng.toFixed(5);
                      }
                    }
                    map.on('move', updateCoords);
                    map.on('zoom', updateCoords);
                    updateCoords();
          map.addControl(new LayerControl());

          // Controllo custom: centra panorami
          var CenterControl = L.Control.extend({
            options: { position: 'bottomright' },
            onAdd: function(map) {
              var btn = L.DomUtil.create('button', 'leaflet-control-custom');
              btn.title = 'Centra panorami';
              btn.style.background = '#27ae60';
              btn.style.border = 'none';
              btn.style.borderRadius = '6px';
              btn.style.width = '40px';
              btn.style.height = '40px';
              btn.style.display = 'flex';
              btn.style.alignItems = 'center';
              btn.style.justifyContent = 'center';
              btn.style.marginLeft = '8px';
              btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="2" fill="#27ae60"/><circle cx="12" cy="12" r="2" fill="white"/><line x1="12" y1="2" x2="12" y2="6" stroke="white" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="white" stroke-width="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="white" stroke-width="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="white" stroke-width="2"/></svg>';
              L.DomEvent.on(btn, 'click', function(e) {
                var group = new L.featureGroup(markers);
                map.fitBounds(group.getBounds().pad(0.2));
                L.DomEvent.stopPropagation(e);
              });
              return btn;
            }
          });
          map.addControl(new CenterControl());

          window._leafletMap = map;
        }, 100);
      }
    });
  }
  window.closeMapModal = function() {
    var modal = document.getElementById('map-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };
  // Chiudi modale mappa con ESC
  window.addEventListener('keydown', function(e) {
    if ((e.key === 'Escape' || e.keyCode === 27)) {
      closeMapModal();
    }
  });

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();
