(function () {
  const valid = l => l === 'ru' || l === 'en';
  const explicit = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('langPref'); } catch (_) {}
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  const lang = valid(explicit) ? explicit : valid(saved) ? saved : ['ru','uk','be','kk'].includes(browser) ? 'ru' : 'en';
  location.replace('/schedule/' + lang + '/' + location.search + location.hash);
})();
