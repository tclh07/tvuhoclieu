/* ====== FAQ TAB SWITCHER ====== */
  (function(){
    const tabs = document.querySelectorAll('.faq-tab');
    const panels = document.querySelectorAll('.faq-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.panel;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
      });
    });
  })();