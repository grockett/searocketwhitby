// Native details remain usable if scripting or local storage is unavailable.
(() => {
  const section = document.getElementById('stages');
  const stages = [...section.querySelectorAll('details.stage')];
  const storageKey = 'cleveland-way:open-stages:v1';
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) stages.forEach(stage => { stage.open = saved.includes(stage.id); });
  } catch { /* Keep the native default when storage is blocked or invalid. */ }

  const openLinkedStage = () => {
    const linked = stages.find(stage => `#${stage.id}` === location.hash);
    if (linked) linked.open = true;
  };
  openLinkedStage();
  window.addEventListener('hashchange', openLinkedStage);

  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(stages.filter(stage => stage.open).map(stage => stage.id))); }
    catch { /* Storage is optional. */ }
  };
  stages.forEach(stage => stage.addEventListener('toggle', save));

  // Move the existing card into a native modal, retaining open stages and listeners.
  const card = document.getElementById('stage-card');
  const slot = document.getElementById('stage-card-slot');
  const dialog = document.getElementById('stage-focus-dialog');
  const focusToggle = document.getElementById('stage-focus-toggle');
  if (typeof dialog.showModal !== 'function') return;
  let pageScroll = 0;
  focusToggle.hidden = false;
  focusToggle.addEventListener('click', () => {
    if (dialog.open) {
      dialog.close();
      return;
    }
    pageScroll = window.scrollY;
    dialog.append(card);
    try {
      dialog.showModal();
    } catch {
      slot.append(card);
      return;
    }
    document.documentElement.classList.add('stage-focus-open');
    focusToggle.textContent = 'Exit fullscreen ×';
    focusToggle.setAttribute('aria-expanded', 'true');
    dialog.scrollTop = 0;
    focusToggle.focus({ preventScroll: true });
  });
  // Covers both the close button and the dialog's native Escape dismissal.
  dialog.addEventListener('close', () => {
    slot.append(card);
    document.documentElement.classList.remove('stage-focus-open');
    focusToggle.textContent = 'Fullscreen ⛶';
    focusToggle.setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: pageScroll, behavior: 'instant' });
    focusToggle.focus({ preventScroll: true });
  });
})();
