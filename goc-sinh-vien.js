  /* ====== Filter bài viết theo chủ đề ====== */
  (function(){
    const chips = document.querySelectorAll('.gsv-chip');
    const items = document.querySelectorAll('.gsv-item');
    const empty = document.getElementById('gsvEmpty');
    const grid  = document.getElementById('gsvGrid');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.cat;
        let visible = 0;
        items.forEach(item => {
          const show = cat === 'all' || item.dataset.cat === cat;
          item.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        empty.style.display = visible === 0 ? '' : 'none';
        grid.style.display  = visible === 0 ? 'none' : '';
      });
    });
  })();
