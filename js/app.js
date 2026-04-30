/* ============================================
   Boudicca Interactive Learning Site
   app.js — Core Interactivity

   Features:
   - Skip navigation link
   - Reading progress bar
   - Navigation scroll effect
   - Scroll-reveal animations
   - Dark mode toggle
   - Teacher mode toggle
   - Success criteria (with localStorage save)
   - CFU questions (with localStorage save)
   - Tab switching (with ARIA roles)
   - Flashcard glossary (with ARIA)
   - OVPRL tool (with localStorage save)
   - Prior knowledge poll (with localStorage save)
   - Mobile menu
   - Image lightbox (with focus trap)
   - Back-to-top button
   - Cross-lesson progress tracking
   - ARIA enhancements
   ============================================ */

// Helper: safe localStorage wrapper (won't crash in restricted browsers)
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch {} },
  getJSON(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } },
  setJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
};

// Helper: detect which lesson page we're on (returns number or null)
function getLessonNumber() {
  const match = window.location.pathname.match(/lesson-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

document.addEventListener('DOMContentLoaded', () => {
  initSkipNav();
  initReadingProgress();
  initNavScroll();
  initScrollReveal();
  initDarkMode();
  initTeacherMode();
  initSuccessCriteria();
  initCFUQuestions();
  initTabs();
  initFlashcards();
  initOVPRL();
  initPriorKnowledge();
  initMobileMenu();
  initLightbox();
  initBackToTop();
  initLessonTracker();
  initAriaEnhancements();
  initMatchingActivities();
  initSequencingActivities();
  initExitTickets();
  initReflectionPanels();
  initWritingScaffolds();
  initHamburgerNav();
});


/* -----------------------------------------
   SKIP NAVIGATION LINK
   Injected as the first element in <body>
   so keyboard users can jump past the nav
   ----------------------------------------- */
function initSkipNav() {
  const firstSection = document.querySelector('.full-section, .lesson-hero, #chapters, main');
  if (!firstSection) return;

  if (!firstSection.id) firstSection.id = 'main-content';

  const link = document.createElement('a');
  link.href = '#' + firstSection.id;
  link.className = 'skip-nav';
  link.textContent = 'Skip to content';
  document.body.insertBefore(link, document.body.firstChild);
}


/* -----------------------------------------
   READING PROGRESS BAR
   ----------------------------------------- */
function initReadingProgress() {
  const bar = document.querySelector('.reading-progress');
  if (!bar) return;

  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Reading progress');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    bar.style.width = progress + '%';
    bar.setAttribute('aria-valuenow', progress);
  }, { passive: true });
}


/* -----------------------------------------
   NAVIGATION SCROLL EFFECT
   ----------------------------------------- */
function initNavScroll() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}


/* -----------------------------------------
   SCROLL REVEAL ANIMATIONS
   ----------------------------------------- */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -80px 0px', threshold: 0.05 });

  revealElements.forEach(el => observer.observe(el));
}


/* -----------------------------------------
   DARK MODE
   Toggle + respects system preference +
   persists to localStorage
   ----------------------------------------- */
function initDarkMode() {
  // Insert toggle button next to teacher toggle
  const teacherBtn = document.querySelector('.teacher-toggle');
  if (teacherBtn) {
    const darkBtn = document.createElement('button');
    darkBtn.className = 'dark-toggle';
    darkBtn.setAttribute('aria-label', 'Toggle dark mode');
    darkBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    teacherBtn.parentNode.insertBefore(darkBtn, teacherBtn);

    darkBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isOn = document.body.classList.contains('dark-mode');
      store.set('boudicca-dark-mode', isOn ? 'true' : 'false');
      darkBtn.setAttribute('aria-label', isOn ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // Restore saved preference, or respect system preference
  const saved = store.get('boudicca-dark-mode');
  if (saved === 'true') {
    document.body.classList.add('dark-mode');
  } else if (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
  }
}


/* -----------------------------------------
   TEACHER MODE
   ----------------------------------------- */
function initTeacherMode() {
  const toggleBtn = document.querySelector('.teacher-toggle');
  if (!toggleBtn) return;

  const saved = store.get('boudicca-teacher-mode');
  if (saved === 'true') {
    document.body.classList.add('teacher-mode');
    toggleBtn.textContent = 'Teacher Mode: ON';
  }

  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('teacher-mode');
    const isOn = document.body.classList.contains('teacher-mode');
    toggleBtn.textContent = isOn ? 'Teacher Mode: ON' : 'Teacher Mode';
    store.set('boudicca-teacher-mode', isOn);
  });
}


/* -----------------------------------------
   SUCCESS CRITERIA SELF-ASSESSMENT
   Now saves state per lesson to localStorage
   ----------------------------------------- */
function initSuccessCriteria() {
  const checkboxes = document.querySelectorAll('.sc-item input[type="checkbox"]');
  const progressBar = document.querySelector('.sc-progress-bar');
  const progressText = document.querySelector('.sc-progress-text');
  if (!checkboxes.length) return;

  const lessonNum = getLessonNumber();
  const storageKey = lessonNum ? 'boudicca-sc-' + lessonNum : null;

  // Restore saved state
  if (storageKey) {
    const saved = store.getJSON(storageKey);
    if (saved && Array.isArray(saved)) {
      checkboxes.forEach((cb, i) => {
        if (saved[i]) cb.checked = true;
      });
    }
  }

  function updateProgress() {
    const total = checkboxes.length;
    const checked = document.querySelectorAll('.sc-item input:checked').length;
    const pct = (checked / total) * 100;

    if (progressBar) progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = checked + ' of ' + total + ' criteria met';

    checkboxes.forEach(cb => {
      const item = cb.closest('.sc-item');
      if (item) item.classList.toggle('checked', cb.checked);
    });

    const reviewItems = document.querySelectorAll('.review-sc-item');
    reviewItems.forEach((item, i) => {
      if (checkboxes[i]) item.classList.toggle('checked', checkboxes[i].checked);
    });

    // Save state
    if (storageKey) {
      const state = Array.from(checkboxes).map(cb => cb.checked);
      store.setJSON(storageKey, state);
    }

    // Mark lesson complete if all criteria are met
    if (lessonNum && pct === 100) {
      markLessonComplete(lessonNum);
    }
  }

  checkboxes.forEach(cb => cb.addEventListener('change', updateProgress));
  updateProgress();
}


/* -----------------------------------------
   CFU QUESTIONS
   Now saves answered state per lesson
   ----------------------------------------- */
function initCFUQuestions() {
  const questions = document.querySelectorAll('.cfu-card');
  const lessonNum = getLessonNumber();
  const storageKey = lessonNum ? 'boudicca-cfu-' + lessonNum : null;
  const savedAnswers = storageKey ? (store.getJSON(storageKey) || {}) : {};

  questions.forEach((card, qIndex) => {
    const options = card.querySelectorAll('.mc-option');
    const checkBtn = card.querySelector('.check-btn');
    const feedback = card.querySelector('.cfu-feedback');
    const correctAnswer = card.dataset.answer;
    let selectedValue = null;
    let answered = false;

    // Restore saved answer
    if (savedAnswers[qIndex] !== undefined) {
      answered = true;
      const savedVal = savedAnswers[qIndex];
      options.forEach(opt => {
        opt.style.cursor = 'default';
        if (opt.dataset.value === correctAnswer) {
          opt.classList.add('correct');
        } else if (opt.dataset.value === savedVal && savedVal !== correctAnswer) {
          opt.classList.add('incorrect');
        }
      });
      if (checkBtn) checkBtn.disabled = true;
      if (feedback) {
        feedback.classList.add('show');
        if (savedVal === correctAnswer) {
          feedback.classList.add('correct');
          feedback.textContent = card.dataset.feedbackCorrect || 'Correct! Well done.';
        } else {
          feedback.classList.add('incorrect');
          feedback.textContent = card.dataset.feedbackIncorrect || 'Not quite. The correct answer is highlighted above.';
        }
      }
    }

    options.forEach(opt => {
      opt.addEventListener('click', () => {
        if (answered) return;
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        selectedValue = opt.dataset.value;
      });
    });

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (answered || !selectedValue) return;
        answered = true;
        checkBtn.disabled = true;

        const isCorrect = selectedValue === correctAnswer;

        options.forEach(opt => {
          opt.style.cursor = 'default';
          if (opt.dataset.value === correctAnswer) {
            opt.classList.add('correct');
            opt.classList.remove('selected');
          } else if (opt.classList.contains('selected')) {
            opt.classList.add('incorrect');
            opt.classList.remove('selected');
          }
        });

        if (feedback) {
          feedback.classList.add('show');
          if (isCorrect) {
            feedback.classList.add('correct');
            feedback.textContent = card.dataset.feedbackCorrect || 'Correct! Well done.';
          } else {
            feedback.classList.add('incorrect');
            feedback.textContent = card.dataset.feedbackIncorrect || 'Not quite. The correct answer is highlighted above.';
          }
        }

        // Save answer
        if (storageKey) {
          savedAnswers[qIndex] = selectedValue;
          store.setJSON(storageKey, savedAnswers);
        }
      });
    }
  });
}


/* -----------------------------------------
   TAB SWITCHING (with ARIA roles)
   ----------------------------------------- */
function initTabs() {
  const tabGroups = document.querySelectorAll('.tab-group');

  tabGroups.forEach(group => {
    const buttons = group.querySelectorAll('.tab-btn');
    const container = group.closest('.full-section') || group.closest('.section-inner') || group.parentElement;
    const contents = container.querySelectorAll('.tab-content');

    // Add ARIA roles
    group.setAttribute('role', 'tablist');

    buttons.forEach((btn, i) => {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      const panelId = btn.dataset.tab + '-panel';
      btn.setAttribute('aria-controls', panelId);
      btn.id = btn.dataset.tab + '-tab';
    });

    contents.forEach(c => {
      c.setAttribute('role', 'tabpanel');
      const tabName = c.id || c.dataset.tab;
      c.id = tabName + '-panel';
      c.setAttribute('aria-labelledby', tabName + '-tab');
    });

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        buttons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        contents.forEach(c => {
          const match = c.id === target + '-panel' || c.dataset.tab === target;
          c.classList.toggle('active', match);
        });
      });

      // Arrow key navigation between tabs
      btn.addEventListener('keydown', (e) => {
        const btns = Array.from(buttons);
        const idx = btns.indexOf(btn);
        let newIdx = -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIdx = (idx + 1) % btns.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIdx = (idx - 1 + btns.length) % btns.length;
        }

        if (newIdx >= 0) {
          btns[newIdx].focus();
          btns[newIdx].click();
        }
      });
    });
  });
}


/* -----------------------------------------
   FLASHCARD GLOSSARY (with ARIA)
   ----------------------------------------- */
function initFlashcards() {
  const cards = document.querySelectorAll('.flashcard');

  cards.forEach(card => {
    // Set aria-label from the front text if not already set
    if (!card.getAttribute('aria-label')) {
      const front = card.querySelector('.flashcard-front');
      if (front) {
        card.setAttribute('aria-label', 'Flashcard: ' + front.textContent.trim() + '. Click to reveal definition.');
      }
    }

    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('flipped');
      card.setAttribute('aria-expanded', flipped ? 'true' : 'false');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const flipped = card.classList.toggle('flipped');
        card.setAttribute('aria-expanded', flipped ? 'true' : 'false');
      }
    });
  });

  // Toggle between list and flashcard views
  const viewToggle = document.querySelector('.glossary-view-toggle');
  const listView = document.querySelector('.glossary-list');
  const cardView = document.querySelector('.flashcard-grid');

  if (viewToggle && listView && cardView) {
    viewToggle.addEventListener('click', () => {
      const showingCards = !cardView.classList.contains('hidden');
      cardView.classList.toggle('hidden');
      listView.classList.toggle('hidden');
      viewToggle.textContent = showingCards ? 'Switch to Flashcards' : 'Switch to List View';
    });
  }
}


/* -----------------------------------------
   OVPRL INTERACTIVE TOOL
   Now saves text to localStorage
   ----------------------------------------- */
function initOVPRL() {
  const hintToggles = document.querySelectorAll('.hint-toggle');
  const lessonNum = getLessonNumber();
  const storageKey = lessonNum ? 'boudicca-ovprl-' + lessonNum : null;

  // Restore saved OVPRL text
  if (storageKey) {
    const saved = store.getJSON(storageKey);
    if (saved) {
      const fields = document.querySelectorAll('.ovprl-field textarea');
      fields.forEach((ta, i) => {
        if (saved[i]) ta.value = saved[i];
      });
    }
  }

  // Save on input
  const ovprlFields = document.querySelectorAll('.ovprl-field textarea');
  ovprlFields.forEach(ta => {
    ta.addEventListener('input', () => {
      if (!storageKey) return;
      const state = Array.from(document.querySelectorAll('.ovprl-field textarea')).map(t => t.value);
      store.setJSON(storageKey, state);
    });
  });

  hintToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const hint = btn.nextElementSibling;
      if (!hint) return;

      const isShowing = hint.classList.contains('show');
      hint.classList.toggle('show');
      btn.textContent = isShowing ? 'Show example answer' : 'Hide example answer';
    });
  });
}


/* -----------------------------------------
   PRIOR KNOWLEDGE POLL
   Saves selection and text to localStorage
   ----------------------------------------- */
function initPriorKnowledge() {
  const pollBtns = document.querySelectorAll('.poll-btn');
  const priorText = document.querySelector('#prior-text');
  const lessonNum = getLessonNumber();
  const storageKey = lessonNum ? 'boudicca-prior-' + lessonNum : null;

  // Restore saved state
  if (storageKey) {
    const saved = store.getJSON(storageKey);
    if (saved) {
      if (saved.poll !== undefined && pollBtns[saved.poll]) {
        pollBtns[saved.poll].classList.add('selected');
      }
      if (saved.text && priorText) {
        priorText.value = saved.text;
      }
    }
  }

  function saveState() {
    if (!storageKey) return;
    const selectedIdx = Array.from(pollBtns).findIndex(b => b.classList.contains('selected'));
    store.setJSON(storageKey, {
      poll: selectedIdx >= 0 ? selectedIdx : undefined,
      text: priorText ? priorText.value : ''
    });
  }

  pollBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.poll-options');
      if (group) group.querySelectorAll('.poll-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      saveState();
    });
  });

  if (priorText) {
    priorText.addEventListener('input', saveState);
  }
}


/* -----------------------------------------
   MOBILE MENU
   ----------------------------------------- */
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!menuBtn || !mobileNav) return;

  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
    const isOpen = !mobileNav.classList.contains('hidden');
    menuBtn.setAttribute('aria-expanded', isOpen);
    menuBtn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileNav.classList.contains('hidden')) {
      mobileNav.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
      menuBtn.focus();
    }
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    });
  });
}


/* -----------------------------------------
   IMAGE LIGHTBOX (with focus trap + ARIA)
   ----------------------------------------- */
function initLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close image viewer">&times;</button>
    <img src="" alt="">
    <div class="lightbox-caption"></div>
  `;
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('img');
  const overlayCaption = overlay.querySelector('.lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  let triggerElement = null;

  const clickableImages = document.querySelectorAll(
    '.featured-image img, .figure-card img, .image-gallery img, .hero-image-wrapper img'
  );

  clickableImages.forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerElement = img;

      overlayImg.src = img.src;
      overlayImg.alt = img.alt;

      const container = img.closest('figure') || img.closest('.featured-image');
      const captionEl = container ? container.querySelector('figcaption, .caption') : null;
      const captionText = captionEl ? captionEl.textContent.trim() : img.alt;

      if (captionText) {
        overlayCaption.textContent = captionText;
        overlayCaption.style.display = 'block';
      } else {
        overlayCaption.style.display = 'none';
      }

      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      closeBtn.focus(); // Move focus into the lightbox
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === closeBtn) closeLightbox();
  });

  closeBtn.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
    // Focus trap: keep Tab within the lightbox
    if (e.key === 'Tab' && overlay.classList.contains('active')) {
      e.preventDefault();
      closeBtn.focus();
    }
  });

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (triggerElement) triggerElement.focus(); // Return focus
    triggerElement = null;
  }
}


/* -----------------------------------------
   BACK TO TOP BUTTON
   ----------------------------------------- */
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* -----------------------------------------
   CROSS-LESSON PROGRESS TRACKING
   Marks lessons as complete in localStorage
   and updates the landing page if we're on it
   ----------------------------------------- */
function markLessonComplete(lessonNum) {
  const progress = store.getJSON('boudicca-progress') || {};
  if (!progress[lessonNum]) {
    progress[lessonNum] = true;
    store.setJSON('boudicca-progress', progress);
  }
}

function initLessonTracker() {
  const progress = store.getJSON('boudicca-progress') || {};

  // If we're on the landing page, show completion state
  const lessonLinks = document.querySelectorAll('.lesson-link[href^="lesson-"]');
  if (lessonLinks.length > 0) {
    let completedCount = 0;

    lessonLinks.forEach(link => {
      const href = link.getAttribute('href');
      const match = href ? href.match(/lesson-(\d+)/) : null;
      if (!match) return;
      const num = parseInt(match[1], 10);

      // Add a badge element
      const badge = document.createElement('span');
      badge.className = 'completion-badge';
      badge.textContent = '✓';
      badge.setAttribute('aria-label', 'Completed');

      // Mark the arrow for hiding
      const arrow = link.querySelector('span:last-child');
      if (arrow && arrow.textContent.includes('→')) {
        arrow.classList.add('lesson-arrow');
      }

      link.appendChild(badge);

      if (progress[num]) {
        link.classList.add('completed');
        completedCount++;
      }
    });

    // Add course progress bar
    const chaptersHeading = document.querySelector('#chapters .text-center');
    if (chaptersHeading && lessonLinks.length > 0) {
      const total = 16;
      const pct = Math.round((completedCount / total) * 100);
      const progressDiv = document.createElement('div');
      progressDiv.className = 'max-w-xs mx-auto mt-4';
      progressDiv.innerHTML = `
        <p class="text-sm text-gray-400 text-center mb-1">${completedCount} of ${total} lessons complete</p>
        <div class="course-progress"><div class="course-progress-bar" style="width: ${pct}%"></div></div>
      `;
      chaptersHeading.appendChild(progressDiv);
    }
  }
}


/* -----------------------------------------
   ARIA ENHANCEMENTS
   Adds missing ARIA attributes dynamically
   ----------------------------------------- */
function initAriaEnhancements() {
  // CFU feedback regions — announce results to screen readers
  document.querySelectorAll('.cfu-feedback').forEach(el => {
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('role', 'status');
  });

  // Nav landmarks
  document.querySelectorAll('.site-nav').forEach(nav => {
    if (!nav.getAttribute('aria-label')) {
      nav.setAttribute('aria-label', 'Main navigation');
    }
  });

  document.querySelectorAll('.mobile-nav').forEach(nav => {
    nav.setAttribute('aria-label', 'Mobile navigation');
  });

  // Reading progress
  const progressBar = document.querySelector('.reading-progress');
  if (progressBar && !progressBar.getAttribute('role')) {
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-label', 'Reading progress');
  }
}


/* -----------------------------------------
   MATCHING ACTIVITIES
   Click-to-match pairs. Items in the
   .match-answers pool are clicked to assign
   them to .match-slot targets.

   HTML structure:
   <div class="match-activity" data-answer="0-2,1-0,2-1">
     <div class="match-prompts">
       <div class="match-prompt" data-idx="0">Prompt A</div>
       <div class="match-slot" data-idx="0">Click an answer</div>
       ...
     </div>
     <div class="match-answers">
       <div class="match-answer" data-idx="0">Answer X</div>
       ...
     </div>
     <button class="check-btn">Check</button>
     <div class="cfu-feedback" aria-live="polite"></div>
   </div>
   ----------------------------------------- */
function initMatchingActivities() {
  document.querySelectorAll('.match-activity').forEach(activity => {
    const answersAll = activity.querySelectorAll('.match-answer');
    const slotsAll = activity.querySelectorAll('.match-slot');
    const checkBtn = activity.querySelector('.check-btn');
    const feedback = activity.querySelector('.cfu-feedback');
    const correctPairs = (activity.dataset.answer || '').split(',');
    let selectedAnswer = null;
    let checked = false;

    // Build a lookup: for each slot index, what's the correct answer index?
    const correctMap = {};
    correctPairs.forEach(pair => {
      const [slotIdx, ansIdx] = pair.split('-');
      correctMap[slotIdx] = ansIdx;
    });

    // Detect if answers need to be reused (more slots than unique answers)
    const uniqueAnsIndices = new Set(Object.values(correctMap));
    const reusableAnswers = slotsAll.length > uniqueAnsIndices.size;

    // Store original slot text for reset
    const originalSlotTexts = [];
    slotsAll.forEach(s => originalSlotTexts.push(s.textContent));

    const lessonNum = getLessonNumber();
    const actIdx = Array.from(document.querySelectorAll('.match-activity')).indexOf(activity);
    const sKey = lessonNum ? 'boudicca-match-' + lessonNum + '-' + actIdx : null;

    function bindListeners() {
      answersAll.forEach(ans => {
        ans.onclick = () => {
          if (checked) return;
          answersAll.forEach(a => a.classList.remove('selected'));
          ans.classList.add('selected');
          selectedAnswer = ans;
        };
      });

      slotsAll.forEach(slot => {
        slot.onclick = () => {
          if (checked || !selectedAnswer) return;
          // Clear any existing correct-label
          const existingLabel = slot.querySelector('.correct-label');
          if (existingLabel) existingLabel.remove();
          // If slot already has an answer, put it back (only if not reusable)
          if (!reusableAnswers && slot.dataset.filledWith !== undefined) {
            const prevAns = answersAll[parseInt(slot.dataset.filledWith)];
            if (prevAns) prevAns.style.display = '';
          }
          slot.textContent = selectedAnswer.textContent;
          slot.classList.add('filled');
          slot.dataset.filledWith = selectedAnswer.dataset.idx;
          // Only hide the answer if it can't be reused
          if (!reusableAnswers) {
            selectedAnswer.style.display = 'none';
          }
          selectedAnswer.classList.remove('selected');
          selectedAnswer = null;
        };
      });
    }

    bindListeners();

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (checked) return;
        checked = true;
        checkBtn.style.display = 'none';

        let correct = 0;
        slotsAll.forEach(slot => {
          const pair = slot.dataset.idx + '-' + (slot.dataset.filledWith || '');
          if (correctPairs.includes(pair)) {
            slot.classList.add('correct-match');
            correct++;
          } else {
            slot.classList.add('incorrect-match');
            // Show what the correct answer should have been
            const correctAnsIdx = correctMap[slot.dataset.idx];
            if (correctAnsIdx !== undefined && answersAll[parseInt(correctAnsIdx)]) {
              const label = document.createElement('span');
              label.className = 'correct-label';
              label.textContent = 'Correct: ' + answersAll[parseInt(correctAnsIdx)].textContent;
              slot.appendChild(label);
            }
          }
        });

        if (feedback) {
          feedback.classList.add('show');
          if (correct === correctPairs.length) {
            feedback.classList.add('correct');
            feedback.textContent = 'All matched correctly! Well done.';
          } else {
            feedback.classList.add('incorrect');
            feedback.textContent = correct + ' of ' + correctPairs.length + ' correct. The correct answers are shown below each incorrect match.';
          }
        }

        // Add "Try Again" button if not all correct
        if (correct < correctPairs.length) {
          const resetBtn = document.createElement('button');
          resetBtn.className = 'reset-btn';
          resetBtn.textContent = 'Try Again';
          checkBtn.parentNode.insertBefore(resetBtn, checkBtn.nextSibling);

          resetBtn.addEventListener('click', () => {
            checked = false;
            selectedAnswer = null;
            // Reset slots
            slotsAll.forEach((slot, i) => {
              slot.textContent = originalSlotTexts[i];
              slot.classList.remove('filled', 'correct-match', 'incorrect-match');
              delete slot.dataset.filledWith;
              const cl = slot.querySelector('.correct-label');
              if (cl) cl.remove();
            });
            // Show all answers again
            answersAll.forEach(ans => {
              ans.style.display = '';
              ans.classList.remove('selected');
            });
            // Reset feedback
            if (feedback) {
              feedback.classList.remove('show', 'correct', 'incorrect');
              feedback.textContent = '';
            }
            // Show check button, remove reset
            checkBtn.style.display = '';
            resetBtn.remove();
            // Clear saved state
            if (sKey) store.setJSON(sKey, null);
            // Re-bind
            bindListeners();
          });
        }

        // Save state
        if (sKey) {
          const placements = {};
          slotsAll.forEach(s => { if (s.dataset.filledWith !== undefined) placements[s.dataset.idx] = s.dataset.filledWith; });
          store.setJSON(sKey, { placements });
        }
      });
    }
  });
}


/* -----------------------------------------
   SEQUENCING ACTIVITIES
   Students reorder items using up/down
   arrows, then check against correct order.

   HTML structure:
   <div class="sequence-activity" data-correct="2,0,3,1">
     <ul class="sequence-list">
       <li class="sequence-item" data-idx="0">Event A</li>
       ...
     </ul>
     <button class="check-btn">Check Order</button>
     <div class="cfu-feedback" aria-live="polite"></div>
   </div>
   ----------------------------------------- */
function initSequencingActivities() {
  document.querySelectorAll('.sequence-activity').forEach(activity => {
    const list = activity.querySelector('.sequence-list');
    const checkBtn = activity.querySelector('.check-btn');
    const feedback = activity.querySelector('.cfu-feedback');
    const correctOrder = (activity.dataset.correct || '').split(',').map(Number);
    let checked = false;

    // Store original item texts for showing correct order
    const allItems = list.querySelectorAll('.sequence-item');
    const itemTexts = {};
    allItems.forEach(item => {
      itemTexts[item.dataset.idx] = item.childNodes[0] ? item.childNodes[0].textContent.trim() : item.textContent.trim();
    });

    // Add numbering and arrow controls to each item
    allItems.forEach((item, i) => {
      if (!item.querySelector('.seq-num')) {
        const num = document.createElement('span');
        num.className = 'seq-num';
        num.textContent = i + 1;
        item.insertBefore(num, item.firstChild);
      }

      if (!item.querySelector('.seq-arrows')) {
        const arrows = document.createElement('span');
        arrows.className = 'seq-arrows';
        arrows.innerHTML = '<button aria-label="Move up">&#9650;</button><button aria-label="Move down">&#9660;</button>';
        item.appendChild(arrows);

        arrows.querySelector('button:first-child').addEventListener('click', (e) => {
          e.stopPropagation();
          if (checked || !item.previousElementSibling) return;
          list.insertBefore(item, item.previousElementSibling);
          renumber();
        });

        arrows.querySelector('button:last-child').addEventListener('click', (e) => {
          e.stopPropagation();
          if (checked || !item.nextElementSibling) return;
          list.insertBefore(item.nextElementSibling, item);
          renumber();
        });
      }
    });

    function renumber() {
      list.querySelectorAll('.sequence-item').forEach((it, i) => {
        const num = it.querySelector('.seq-num');
        if (num) num.textContent = i + 1;
      });
    }

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (checked) return;
        checked = true;
        checkBtn.style.display = 'none';

        const currentItems = list.querySelectorAll('.sequence-item');
        const currentOrder = Array.from(currentItems).map(it => parseInt(it.dataset.idx));
        let allCorrect = true;
        let correctCount = 0;

        currentOrder.forEach((idx, pos) => {
          const item = currentItems[pos];
          if (correctOrder[pos] === idx) {
            item.classList.add('correct-pos');
            correctCount++;
          } else {
            item.classList.add('incorrect-pos');
            allCorrect = false;
            // Show what should be in this position
            const shouldBeIdx = correctOrder[pos];
            const correctText = itemTexts[shouldBeIdx] || '';
            if (correctText) {
              const label = document.createElement('span');
              label.className = 'correct-label';
              label.textContent = 'Should be: ' + correctText;
              // Insert before the arrows
              const arrows = item.querySelector('.seq-arrows');
              if (arrows) {
                item.insertBefore(label, arrows);
              } else {
                item.appendChild(label);
              }
            }
          }
          // Disable arrows
          item.querySelectorAll('.seq-arrows button').forEach(b => b.disabled = true);
        });

        if (feedback) {
          feedback.classList.add('show');
          if (allCorrect) {
            feedback.classList.add('correct');
            feedback.textContent = 'Perfect order! Well done.';
          } else {
            feedback.classList.add('incorrect');
            feedback.textContent = correctCount + ' of ' + correctOrder.length + ' in the right position. The correct placement is shown on each incorrect item.';
          }
        }

        // Add "Try Again" button if not all correct
        if (!allCorrect) {
          const resetBtn = document.createElement('button');
          resetBtn.className = 'reset-btn';
          resetBtn.textContent = 'Try Again';
          checkBtn.parentNode.insertBefore(resetBtn, checkBtn.nextSibling);

          resetBtn.addEventListener('click', () => {
            checked = false;
            // Remove correct-pos, incorrect-pos, correct-label
            list.querySelectorAll('.sequence-item').forEach(item => {
              item.classList.remove('correct-pos', 'incorrect-pos');
              const cl = item.querySelector('.correct-label');
              if (cl) cl.remove();
              // Re-enable arrows
              item.querySelectorAll('.seq-arrows button').forEach(b => b.disabled = false);
            });
            // Reset feedback
            if (feedback) {
              feedback.classList.remove('show', 'correct', 'incorrect');
              feedback.textContent = '';
            }
            // Show check button, remove reset
            checkBtn.style.display = '';
            resetBtn.remove();
          });
        }
      });
    }
  });
}


/* -----------------------------------------
   EXIT TICKETS
   Saves student responses to localStorage.
   Located inside the Review of Learning section.
   ----------------------------------------- */
function initExitTickets() {
  const lessonNum = getLessonNumber();
  if (!lessonNum) return;
  const sKey = 'boudicca-exit-' + lessonNum;

  document.querySelectorAll('.exit-ticket textarea').forEach((ta, i) => {
    const saved = store.getJSON(sKey);
    if (saved && saved[i]) ta.value = saved[i];

    ta.addEventListener('input', () => {
      const state = {};
      document.querySelectorAll('.exit-ticket textarea').forEach((t, j) => { state[j] = t.value; });
      store.setJSON(sKey, state);
    });
  });
}


/* -----------------------------------------
   REFLECTION PANELS
   Saves confidence rating + text to localStorage.
   ----------------------------------------- */
function initReflectionPanels() {
  const lessonNum = getLessonNumber();
  if (!lessonNum) return;
  const sKey = 'boudicca-reflect-' + lessonNum;

  const confidenceBtns = document.querySelectorAll('.confidence-btn');
  const reflectText = document.querySelector('.reflection-text');
  const saved = store.getJSON(sKey);

  if (saved) {
    if (saved.confidence !== undefined && confidenceBtns[saved.confidence]) {
      confidenceBtns[saved.confidence].classList.add('selected');
    }
    if (saved.text && reflectText) reflectText.value = saved.text;
  }

  function saveReflection() {
    const selectedIdx = Array.from(confidenceBtns).findIndex(b => b.classList.contains('selected'));
    store.setJSON(sKey, {
      confidence: selectedIdx >= 0 ? selectedIdx : undefined,
      text: reflectText ? reflectText.value : ''
    });
  }

  confidenceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      confidenceBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      saveReflection();
    });
  });

  if (reflectText) reflectText.addEventListener('input', saveReflection);
}


/* -----------------------------------------
   WRITING SCAFFOLDS
   Toggle show/hide for scaffold panels
   in review question sections
   ----------------------------------------- */
function initWritingScaffolds() {
  document.querySelectorAll('.scaffold-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const scaffold = btn.nextElementSibling;
      if (!scaffold) return;
      const isHidden = scaffold.classList.contains('hidden');
      scaffold.classList.toggle('hidden');
      btn.textContent = isHidden ? 'Hide writing scaffold' : 'Show writing scaffold';
    });
  });
}


/* -----------------------------------------
   HAMBURGER NAVIGATION PANEL
   Slide-in panel from the right with:
   - Home + Glossary links
   - In This Lesson section jumps
   - Previous / Next lesson navigation
   Builds dynamically from page content.
   ----------------------------------------- */
function initHamburgerNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Don't add if there's already a hamburger
  if (document.querySelector('.hamburger-btn')) return;

  const lessonNum = getLessonNumber();
  const isLessonPage = lessonNum !== null;
  const isGlossary = window.location.pathname.includes('glossary');

  // --- Create the hamburger button ---
  const btn = document.createElement('button');
  btn.className = 'hamburger-btn';
  btn.setAttribute('aria-label', 'Open navigation menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="bar"></span>';

  // Insert as the FIRST item in the nav's button group
  const btnGroup = nav.querySelector('.flex.items-center.gap-3');
  if (btnGroup) {
    btnGroup.insertBefore(btn, btnGroup.firstChild);
  }

  // --- Create the overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'nav-panel-overlay';
  document.body.appendChild(overlay);

  // --- Create the panel ---
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.setAttribute('role', 'navigation');
  panel.setAttribute('aria-label', 'Site navigation');

  let panelHTML = '';

  // Section 1: Site links
  panelHTML += '<div class="panel-section">';
  panelHTML += '<p class="panel-label">Navigate</p>';
  panelHTML += '<a href="index.html" class="panel-link"><svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Home</a>';
  panelHTML += '<a href="glossary.html" class="panel-link"><svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Glossary</a>';
  panelHTML += '</div>';

  // Section 2: In This Lesson (only on lesson pages)
  if (isLessonPage) {
    panelHTML += '<div class="panel-divider"></div>';
    panelHTML += '<div class="panel-section">';
    panelHTML += '<p class="panel-label">In This Lesson</p>';

    // Auto-detect sections from the page
    const sectionMap = [
      { selector: '#lisc, [id*="learning"]', label: 'Learning Intention' },
      { selector: '#prior-knowledge, [id*="prior"]', label: 'Prior Knowledge' },
    ];

    // Find all content chunks
    const chunks = document.querySelectorAll('[id^="chunk-"]');
    chunks.forEach(chunk => {
      const heading = chunk.querySelector('.section-heading, h2');
      const label = heading ? heading.textContent.trim() : 'Content';
      // Truncate long headings
      const shortLabel = label.length > 40 ? label.substring(0, 37) + '...' : label;
      sectionMap.push({ selector: '#' + chunk.id, label: shortLabel });
    });

    sectionMap.push(
      { selector: '#practice, [id*="practice"]', label: 'Review Questions' },
      { selector: '#key-terms, [id*="key-terms"]', label: 'Key Terms' },
      { selector: '#review, [id*="review"]:last-of-type', label: 'Review of Learning' }
    );

    sectionMap.forEach(item => {
      const el = document.querySelector(item.selector);
      if (el) {
        const targetId = el.id || '';
        if (targetId) {
          panelHTML += '<a href="#' + targetId + '" class="panel-link section-jump"><svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/></svg>' + item.label + '</a>';
        }
      }
    });

    panelHTML += '</div>';

    // Section 3: Lesson navigation
    panelHTML += '<div class="panel-divider"></div>';
    panelHTML += '<div class="panel-section">';
    panelHTML += '<p class="panel-label">Lessons</p>';

    if (lessonNum > 1) {
      panelHTML += '<a href="lesson-' + (lessonNum - 1) + '.html" class="lesson-nav-link"><span class="nav-arrow">&larr;</span> Lesson ' + (lessonNum - 1) + '</a>';
    }

    panelHTML += '<div class="panel-link active" style="cursor:default;"><svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Lesson ' + lessonNum + ' (current)</div>';

    if (lessonNum < 16) {
      panelHTML += '<a href="lesson-' + (lessonNum + 1) + '.html" class="lesson-nav-link">Lesson ' + (lessonNum + 1) + ' <span class="nav-arrow">&rarr;</span></a>';
    }

    panelHTML += '</div>';
  }

  panel.innerHTML = panelHTML;
  document.body.appendChild(panel);

  // --- Scroll spy: highlight active section ---
  if (isLessonPage) {
    const jumpLinks = panel.querySelectorAll('.section-jump');
    const sections = [];
    jumpLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) sections.push({ el: target, link: link });
      }
    });

    if (sections.length > 0) {
      const scrollSpy = () => {
        const scrollY = window.scrollY + 120;
        let activeLink = null;
        sections.forEach(({ el, link }) => {
          if (el.offsetTop <= scrollY) {
            activeLink = link;
          }
        });
        jumpLinks.forEach(l => l.classList.remove('active'));
        if (activeLink) activeLink.classList.add('active');
      };

      window.addEventListener('scroll', scrollSpy, { passive: true });
      scrollSpy();
    }
  }

  // --- Open/close logic ---
  function openPanel() {
    panel.classList.add('open');
    overlay.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });

  overlay.addEventListener('click', closePanel);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closePanel();
      btn.focus();
    }
  });

  // Close when clicking a section jump link (and smooth scroll)
  panel.querySelectorAll('.section-jump').forEach(link => {
    link.addEventListener('click', () => {
      closePanel();
    });
  });
}
