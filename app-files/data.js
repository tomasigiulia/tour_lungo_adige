var APP_DATA = {
  // Coordinate GPS estratte da EXIF metadati delle immagini originali
  "coordinates": [
    { "lat": 45.2213333333333, "lng": 11.2943416666667 },    // Panorama 1
    { "lat": 45.2208555555556, "lng": 11.2942472222222 },    // Panorama 2
    { "lat": 45.1443555555556, "lng": 12.300925 }            // Panorama 3
  ],
  "scenes": [
    {
      "id": "0-panorama1",
      "name": "panorama1",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        },
        {
          "tileSize": 512,
          "size": 4096
        }
      ],
      "faceSize": 3000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 0.40911662856915854,
          "pitch": 0.33188340295066965,
          "rotation": 1.5707963267948966,
          "target": "1-panorama2"
        }
      ],
      "infoHotspots": [
        {
          "yaw": -0.4128,
          "pitch": 0.4340,
          "title": "Sicyos angulatus",
          "text": "Pianta annuale erbacea, rampicante. Possiede dei fusti lianosi mediamente lunghi a maturità tra i 2 e i 5 metri, ma che quando la pianta si trova in condizioni ambientali ottimali possono anche diventare più lunghi. Grazie a cirri ramosi questi possono aggrapparsi ad altre piante o sostegni di diverso tipo.",
          "image": "hotspots/Sicyos_angulatus.jpg"
        }
      ]
    },
    {
      "id": "1-panorama2",
      "name": "panorama2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        },
        {
          "tileSize": 512,
          "size": 4096
        }
      ],
      "faceSize": 3000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [],
      "infoHotspots": [
        {
          "yaw": 0.45568532598518274,
          "pitch": 0.32316215508597246,
          "title": "prova",
          "text": "Text"
        }
      ]
    },
    {
      "id": "2-panorama3",
      "name": "panorama3",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        },
        {
          "tileSize": 512,
          "size": 4096
        }
      ],
      "faceSize": 3000,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [],
      "infoHotspots": []
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};
