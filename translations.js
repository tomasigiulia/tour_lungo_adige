// Sistema di traduzione per il tour virtuale
var TRANSLATIONS = {
  it: {
    loading: 'Caricamento...',
    close: 'Chiudi',
    autoRotation: 'Rotazione automatica',
    fullscreen: 'Schermo intero',
    sceneList: 'Elenco scene'
  },
  en: {
    loading: 'Loading...',
    close: 'Close',
    autoRotation: 'Auto rotation',
    fullscreen: 'Full screen',
    sceneList: 'Scene list'
  }
};

// Lingua corrente (default: italiano)
var currentLanguage = localStorage.getItem('tourLanguage') || 'it';

// Funzione per ottenere traduzione
function getTranslation(key) {
  return (TRANSLATIONS[currentLanguage] && TRANSLATIONS[currentLanguage][key]) || TRANSLATIONS['it'][key] || key;
}

// Funzione per cambiare lingua
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLanguage = lang;
  localStorage.setItem('tourLanguage', lang);
}

// Funzione per ottenere testo bilingue
function getBilingualText(textObj) {
  if (typeof textObj === 'string') return textObj;
  return textObj[currentLanguage] || textObj['it'] || textObj['en'] || '';
}
