(() => {
  document.querySelectorAll('[data-walk-decision]').forEach(decision => {
    const panels = new Map(Array.from(decision.querySelectorAll('[data-walk-panel]'),
      panel => [panel.dataset.walkPanel, panel]));
    const questions = Array.from(decision.querySelectorAll('[data-walk-question]'));
    const progress = decision.querySelector('[data-walk-progress]');
    const actions = decision.querySelector('[data-walk-actions]');
    const back = decision.querySelector('[data-walk-back]');
    const restart = decision.querySelector('[data-walk-restart]');
    const trail = [questions[0]];

    function showPanel(moveFocus) {
      const current = trail.at(-1);
      const step = questions.indexOf(current) + 1;
      progress.textContent = step ? `Question ${step} of ${questions.length}` : 'Recommendation';
      panels.forEach(panel => { panel.inert = panel.hidden = panel !== current; });
      back.disabled = restart.disabled = trail.length === 1;

      if (moveFocus) {
        const heading = current.querySelector('h3');
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
    }

    decision.querySelectorAll('[data-walk-next]').forEach(choice => {
      choice.addEventListener('click', () => {
        trail.push(panels.get(choice.dataset.walkNext));
        showPanel(true);
      });
    });
    back.addEventListener('click', () => {
      trail.pop();
      showPanel(true);
    });
    restart.addEventListener('click', () => {
      trail.length = 1;
      showPanel(true);
    });

    showPanel(false);
    decision.classList.add('walk-decision-ready');
    progress.hidden = actions.hidden = false;
  });
})();
