/* ==========================================================
   NPTEL ML Quiz Web Application - Logic & Interactivity
   ========================================================== */

(function () {
  'use strict';

  // --- State Variables ---
  const state = {
    selectedWeek: 1,
    selectedCount: 10,
    shuffleQuestions: true,
    shuffleOptions: true,
    soundEnabled: true,
    darkMode: true,
    
    activeQuestions: [],
    currentIndex: 0,
    currentQuestion: null,
    currentShuffledOptions: [],
    hasAnsweredCurrent: false,
    
    // User answer history for current session:
    // array of { questionObj, selectedOption, isCorrect, optionsOrder }
    answersHistory: [],
    
    // Timer
    startTime: null,
    timerInterval: null,
    totalSecondsElapsed: 0,
    
    // Review filter: 'incorrect' | 'all' | 'correct'
    reviewFilter: 'incorrect'
  };

  // --- DOM Elements ---
  const screens = {
    setup: document.getElementById('setup-screen'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
  };

  // Setup DOM
  const weekCards = document.querySelectorAll('.week-card');
  const brandSub = document.getElementById('brand-sub');
  const heroCountChip = document.getElementById('hero-count-chip');
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const presetAllChip = document.getElementById('preset-all-chip');
  const presetAllCount = document.getElementById('preset-all-count');

  const presetChips = document.querySelectorAll('.preset-chip');
  const customCountInput = document.getElementById('custom-count-input');
  const applyCustomCountBtn = document.getElementById('apply-custom-count-btn');
  const shuffleQToggle = document.getElementById('shuffle-questions-toggle');
  const shuffleOptToggle = document.getElementById('shuffle-options-toggle');
  const startQuizBtn = document.getElementById('start-quiz-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleLabel = document.getElementById('theme-toggle-label');
  const soundToggle = document.getElementById('sound-toggle');

  // Quiz DOM
  const questionIndexBadge = document.getElementById('question-index-badge');
  const timerText = document.getElementById('timer-text');
  const liveCorrectCount = document.getElementById('live-correct-count');
  const liveIncorrectCount = document.getElementById('live-incorrect-count');
  const quitQuizBtn = document.getElementById('quit-quiz-btn');
  const progressFill = document.getElementById('progress-fill');
  
  const questionOriginalId = document.getElementById('question-original-id');
  const questionTextContent = document.getElementById('question-text-content');
  const optionsContainer = document.getElementById('options-container');
  
  const feedbackContainer = document.getElementById('feedback-container');
  const feedbackBanner = document.getElementById('feedback-banner');
  const feedbackIcon = document.getElementById('feedback-icon');
  const feedbackTitle = document.getElementById('feedback-title');
  const feedbackSubtitle = document.getElementById('feedback-subtitle');
  const explanationText = document.getElementById('explanation-text');
  const nextQuestionBtn = document.getElementById('next-question-btn');
  const nextBtnText = document.getElementById('next-btn-text');

  // Results DOM
  const scoreRingCircle = document.getElementById('score-ring-circle');
  const scorePercentage = document.getElementById('score-percentage');
  const resultBadge = document.getElementById('result-badge');
  const resultHeadline = document.getElementById('result-headline');
  const resultSubtext = document.getElementById('result-subtext');
  const statCorrect = document.getElementById('stat-correct');
  const statIncorrect = document.getElementById('stat-incorrect');
  const statTime = document.getElementById('stat-time');
  const retryIncorrectBtn = document.getElementById('retry-incorrect-btn');
  const retryIncorrectLabel = document.getElementById('retry-incorrect-label');
  const restartNewBtn = document.getElementById('restart-new-btn');
  
  const tabAll = document.getElementById('tab-all');
  const tabIncorrect = document.getElementById('tab-incorrect');
  const tabCorrect = document.getElementById('tab-correct');
  const countAllTab = document.getElementById('count-all-tab');
  const countIncorrectTab = document.getElementById('count-incorrect-tab');
  const countCorrectTab = document.getElementById('count-correct-tab');
  const reviewItemsList = document.getElementById('review-items-list');

  // --- Sound Effects using Web Audio API ---
  const audioCtx = (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined')
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playSound(type) {
    if (!state.soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      if (type === 'correct') {
        // Cheerful ascending major chime
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

        osc2.frequency.setValueAtTime(1046.50, now + 0.15); // C6

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now + 0.15);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);

      } else if (type === 'incorrect') {
        // Soft low discordant buzz
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.25);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.3);

      } else if (type === 'complete') {
        // Fanfare chord
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.08);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + 0.6 + idx * 0.08);
        });
      }
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }

  // --- Fisher-Yates Shuffle Utility ---
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // --- Screen Navigation ---
  function showScreen(screenKey) {
    Object.values(screens).forEach(screen => {
      screen.classList.remove('active');
    });
    if (screens[screenKey]) {
      screens[screenKey].classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Week / Module Selection ---
  function getActiveWeekBank() {
    return WEEKS_DATA[state.selectedWeek]?.questions || QUESTIONS_BANK;
  }

  function switchWeek(weekNum) {
    state.selectedWeek = weekNum;
    CURRENT_WEEK = weekNum;
    const meta = WEEKS_DATA[weekNum];
    if (!meta) return;

    QUESTIONS_BANK = meta.questions;

    // Update Week card buttons active state
    weekCards.forEach(card => {
      const w = parseInt(card.getAttribute('data-week'), 10);
      card.classList.toggle('selected', w === weekNum);
    });

    // Update Header and Hero text
    if (brandSub) brandSub.innerHTML = meta.subheading.replace(' • ', ' &bull; ');
    if (heroCountChip) heroCountChip.textContent = meta.heroBadge;
    if (heroDesc) heroDesc.textContent = meta.heroDesc;

    // Update Full Bank preset chip
    if (presetAllCount) presetAllCount.textContent = meta.totalQuestions;

    // Update Custom count input limits
    if (customCountInput) {
      customCountInput.max = meta.totalQuestions;
      customCountInput.placeholder = `1 - ${meta.totalQuestions}`;
      if (customCountInput.value && parseInt(customCountInput.value, 10) > meta.totalQuestions) {
        customCountInput.value = meta.totalQuestions;
      }
    }

    // Update selectedCount if currently set to Full Bank or if previous count exceeded new bank
    const selectedPreset = document.querySelector('.preset-chip.selected');
    if (selectedPreset && selectedPreset.getAttribute('data-count') === 'all') {
      state.selectedCount = meta.totalQuestions;
    } else if (state.selectedCount > meta.totalQuestions) {
      state.selectedCount = meta.totalQuestions;
    }

    playSound('correct');
  }

  weekCards.forEach(card => {
    card.addEventListener('click', () => {
      const weekNum = parseInt(card.getAttribute('data-week'), 10);
      if (state.selectedWeek !== weekNum) {
        switchWeek(weekNum);
      }
    });
  });

  // --- Setup Preset Selection ---
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      const val = chip.getAttribute('data-count');
      const currentBank = getActiveWeekBank();
      if (val === 'all') {
        state.selectedCount = currentBank.length;
      } else {
        state.selectedCount = parseInt(val, 10);
      }
      customCountInput.value = '';
    });
  });

  applyCustomCountBtn.addEventListener('click', handleCustomCount);
  customCountInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCustomCount();
  });

  function handleCustomCount() {
    const currentBank = getActiveWeekBank();
    let num = parseInt(customCountInput.value, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > currentBank.length) num = currentBank.length;
    customCountInput.value = num;

    presetChips.forEach(c => c.classList.remove('selected'));
    state.selectedCount = num;
  }

  // --- Start Quiz Action ---
  startQuizBtn.addEventListener('click', () => {
    state.shuffleQuestions = shuffleQToggle.checked;
    state.shuffleOptions = shuffleOptToggle.checked;

    const currentBank = getActiveWeekBank();
    let pool = [...currentBank];
    if (state.shuffleQuestions) {
      pool = shuffleArray(pool);
    }

    const count = Math.min(state.selectedCount, pool.length);
    state.activeQuestions = pool.slice(0, count);
    initiateSession(state.activeQuestions);
  });

  function initiateSession(questionList) {
    state.activeQuestions = questionList;
    state.currentIndex = 0;
    state.answersHistory = [];
    state.hasAnsweredCurrent = false;

    // Reset and start timer
    clearInterval(state.timerInterval);
    state.startTime = Date.now();
    state.totalSecondsElapsed = 0;
    timerText.textContent = "00:00";
    state.timerInterval = setInterval(updateTimer, 1000);

    updateLiveScores();
    showScreen('quiz');
    loadQuestion(state.currentIndex);
  }

  function updateTimer() {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    state.totalSecondsElapsed = elapsed;
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timerText.textContent = `${mins}:${secs}`;
  }

  function updateLiveScores() {
    const correct = state.answersHistory.filter(a => a.isCorrect).length;
    const incorrect = state.answersHistory.filter(a => !a.isCorrect).length;
    liveCorrectCount.textContent = correct;
    liveIncorrectCount.textContent = incorrect;
  }

  // --- Render Single Question ---
  function loadQuestion(index) {
    state.hasAnsweredCurrent = false;
    const q = state.activeQuestions[index];
    state.currentQuestion = q;

    // Badges & Progress
    questionIndexBadge.textContent = `Question ${index + 1} of ${state.activeQuestions.length}`;
    questionOriginalId.textContent = `W${state.selectedWeek} • Q#${q.id}`;
    const progressPercent = ((index) / state.activeQuestions.length) * 100;
    progressFill.style.width = `${progressPercent}%`;

    // Question Text
    questionTextContent.textContent = q.question;

    // Prepare Options (Shuffle if requested)
    if (state.shuffleOptions) {
      state.currentShuffledOptions = shuffleArray(q.options);
    } else {
      state.currentShuffledOptions = [...q.options];
    }

    // Render Options
    optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    state.currentShuffledOptions.forEach((optText, optIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.id = `option-choice-${optIdx}`;
      btn.setAttribute('data-index', optIdx);

      btn.innerHTML = `
        <span class="option-key">${letters[optIdx] || optIdx + 1}</span>
        <span class="option-text">${escapeHTML(optText)}</span>
      `;

      btn.addEventListener('click', () => handleOptionSelect(optIdx));
      optionsContainer.appendChild(btn);
    });

    // Hide feedback container
    feedbackContainer.classList.add('hidden');
    feedbackContainer.setAttribute('aria-hidden', 'true');

    // Update Next button label if last question
    if (index === state.activeQuestions.length - 1) {
      nextBtnText.textContent = 'View Quiz Summary';
    } else {
      nextBtnText.textContent = 'Next Question';
    }
  }

  // --- Immediate Feedback on Answer Selection ---
  function handleOptionSelect(selectedIndex) {
    if (state.hasAnsweredCurrent) return;
    state.hasAnsweredCurrent = true;

    const q = state.currentQuestion;
    const chosenOption = state.currentShuffledOptions[selectedIndex];
    const isCorrect = (chosenOption.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());

    // Record answer
    state.answersHistory.push({
      question: q,
      weekNum: state.selectedWeek,
      selectedOption: chosenOption,
      correctOption: q.correctAnswer,
      isCorrect: isCorrect,
      explanation: q.explanation
    });

    updateLiveScores();

    // Disable all option buttons and apply immediate styling
    const optionButtons = optionsContainer.querySelectorAll('.option-btn');
    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      const optVal = state.currentShuffledOptions[idx];
      const isThisCorrect = (optVal.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase());

      if (idx === selectedIndex) {
        if (isCorrect) {
          btn.classList.add('selected-correct');
        } else {
          btn.classList.add('selected-incorrect');
        }
      } else if (isThisCorrect) {
        // Show the actual correct answer if user got it wrong
        btn.classList.add('revealed-correct');
      } else {
        btn.classList.add('dimmed');
      }
    });

    // Sound effect
    if (isCorrect) {
      playSound('correct');
    } else {
      playSound('incorrect');
    }

    // Populate and show Feedback Banner
    feedbackContainer.classList.remove('hidden');
    feedbackContainer.setAttribute('aria-hidden', 'false');

    if (isCorrect) {
      feedbackBanner.className = 'feedback-banner correct';
      feedbackIcon.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      feedbackTitle.textContent = 'Correct Answer!';
      feedbackSubtitle.textContent = 'Nicely done! Keep up the momentum.';
    } else {
      feedbackBanner.className = 'feedback-banner incorrect';
      feedbackIcon.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      feedbackTitle.textContent = 'Incorrect';
      feedbackSubtitle.textContent = `Correct: ${q.correctAnswer}`;
    }

    // Explanation
    explanationText.textContent = q.explanation || "No explanation provided.";

    // Update progress bar
    const progressPercent = ((state.currentIndex + 1) / state.activeQuestions.length) * 100;
    progressFill.style.width = `${progressPercent}%`;

    // Scroll to feedback if on small screens
    feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Next Question Handler ---
  nextQuestionBtn.addEventListener('click', proceedToNext);

  function proceedToNext() {
    if (state.currentIndex < state.activeQuestions.length - 1) {
      state.currentIndex++;
      loadQuestion(state.currentIndex);
    } else {
      finishQuizSession();
    }
  }

  // Keyboard Shortcuts (1-4, A-D for options; Enter/Space for next)
  window.addEventListener('keydown', (e) => {
    // Only in quiz view
    if (!screens.quiz.classList.contains('active')) return;

    if (!state.hasAnsweredCurrent) {
      const keyMap = {
        '1': 0, 'a': 0, 'A': 0,
        '2': 1, 'b': 1, 'B': 1,
        '3': 2, 'c': 2, 'C': 2,
        '4': 3, 'd': 3, 'D': 3,
        '5': 4, 'e': 4, 'E': 4
      };
      if (e.key in keyMap) {
        const idx = keyMap[e.key];
        const btn = document.getElementById(`option-choice-${idx}`);
        if (btn && !btn.disabled) {
          handleOptionSelect(idx);
        }
      }
    } else {
      // After answering, Enter or Space proceeds to next question
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        proceedToNext();
      }
    }
  });

  // Quit button
  quitQuizBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to end this practice session early? You will see results for answered questions.")) {
      finishQuizSession();
    }
  });

  // --- Finish Quiz & Show Results ---
  function finishQuizSession() {
    clearInterval(state.timerInterval);
    playSound('complete');

    const total = state.answersHistory.length;
    const correct = state.answersHistory.filter(a => a.isCorrect).length;
    const incorrect = total - correct;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Results Hero Stats
    scorePercentage.textContent = `${percent}%`;
    statCorrect.textContent = correct;
    statIncorrect.textContent = incorrect;

    const mins = String(Math.floor(state.totalSecondsElapsed / 60)).padStart(2, '0');
    const secs = String(state.totalSecondsElapsed % 60).padStart(2, '0');
    statTime.textContent = `${mins}:${secs}`;

    // SVG Circle Stroke Animation
    // Circumference of r=52 is 2 * PI * 52 ≈ 326.7
    const circumference = 326.7;
    const offset = circumference - (percent / 100) * circumference;
    scoreRingCircle.style.strokeDashoffset = offset;

    // Ring color dynamic based on performance
    if (percent >= 80) {
      scoreRingCircle.style.stroke = 'var(--emerald)';
      resultHeadline.textContent = "Outstanding Performance!";
      resultBadge.textContent = "Mastery Level";
    } else if (percent >= 50) {
      scoreRingCircle.style.stroke = 'var(--accent-primary)';
      resultHeadline.textContent = "Good Effort!";
      resultBadge.textContent = "Passing Score";
    } else {
      scoreRingCircle.style.stroke = 'var(--rose)';
      resultHeadline.textContent = "Keep Practicing!";
      resultBadge.textContent = "Needs Review";
    }

    resultSubtext.textContent = `You answered ${correct} out of ${total} questions correctly in this session.`;

    // Retry Incorrect button state
    if (incorrect > 0) {
      retryIncorrectBtn.disabled = false;
      retryIncorrectLabel.textContent = `Retry Incorrect Questions (${incorrect})`;
      // Default active tab to Incorrect as requested
      state.reviewFilter = 'incorrect';
    } else {
      retryIncorrectBtn.disabled = true;
      retryIncorrectLabel.textContent = `All Answers Correct! 🎉`;
      state.reviewFilter = 'all';
    }

    // Update Tab Counts
    countAllTab.textContent = total;
    countIncorrectTab.textContent = incorrect;
    countCorrectTab.textContent = correct;

    setActiveTab(state.reviewFilter);
    renderReviewList();
    showScreen('results');
  }

  // --- Results Review Tab Switching ---
  tabAll.addEventListener('click', () => {
    state.reviewFilter = 'all';
    setActiveTab('all');
    renderReviewList();
  });

  tabIncorrect.addEventListener('click', () => {
    state.reviewFilter = 'incorrect';
    setActiveTab('incorrect');
    renderReviewList();
  });

  tabCorrect.addEventListener('click', () => {
    state.reviewFilter = 'correct';
    setActiveTab('correct');
    renderReviewList();
  });

  function setActiveTab(filter) {
    [tabAll, tabIncorrect, tabCorrect].forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
    });

    if (filter === 'all') {
      tabAll.classList.add('active');
      tabAll.setAttribute('aria-selected', 'true');
    } else if (filter === 'incorrect') {
      tabIncorrect.classList.add('active');
      tabIncorrect.setAttribute('aria-selected', 'true');
    } else {
      tabCorrect.classList.add('active');
      tabCorrect.setAttribute('aria-selected', 'true');
    }
  }

  // --- Render Detailed Question Review List ---
  function renderReviewList() {
    reviewItemsList.innerHTML = '';

    let items = state.answersHistory;
    if (state.reviewFilter === 'incorrect') {
      items = state.answersHistory.filter(a => !a.isCorrect);
    } else if (state.reviewFilter === 'correct') {
      items = state.answersHistory.filter(a => a.isCorrect);
    }

    if (items.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-review';
      if (state.reviewFilter === 'incorrect') {
        emptyDiv.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Zero Incorrect Answers!</h3>
          <p>You scored 100% on all answered questions. Fantastic work!</p>
        `;
      } else {
        emptyDiv.innerHTML = `
          <h3>No Questions Found</h3>
          <p>There are no questions matching this filter.</p>
        `;
      }
      reviewItemsList.appendChild(emptyDiv);
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = `review-item ${item.isCorrect ? 'is-correct' : 'is-incorrect'}`;

      card.innerHTML = `
        <div class="review-item-header">
          <span class="review-q-index">Question ${state.answersHistory.indexOf(item) + 1} (Week ${item.weekNum || state.selectedWeek} &bull; Q#${item.question.id})</span>
          <span class="review-status-tag ${item.isCorrect ? 'correct' : 'incorrect'}">
            ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        </div>

        <h4 class="review-question-text">${escapeHTML(item.question.question)}</h4>

        <div class="answers-comparison">
          <div class="ans-row ${item.isCorrect ? 'user-correct' : 'user-wrong'}">
            <span class="ans-label">Your Answer:</span>
            <span class="ans-text">${escapeHTML(item.selectedOption)}</span>
          </div>
          ${!item.isCorrect ? `
            <div class="ans-row correct-ans">
              <span class="ans-label">Correct Answer:</span>
              <span class="ans-text">${escapeHTML(item.correctOption)}</span>
            </div>
          ` : ''}
        </div>

        <div class="review-explanation">
          <strong>Why:</strong> ${escapeHTML(item.explanation)}
        </div>
      `;

      reviewItemsList.appendChild(card);
    });
  }

  // --- Retry Incorrect Questions Action ---
  retryIncorrectBtn.addEventListener('click', () => {
    const incorrectList = state.answersHistory
      .filter(a => !a.isCorrect)
      .map(a => a.question);

    if (incorrectList.length === 0) return;

    // Shuffle them again
    const reordered = shuffleArray(incorrectList);
    initiateSession(reordered);
  });

  // --- Restart New Session Action ---
  restartNewBtn.addEventListener('click', () => {
    showScreen('setup');
  });

  // --- Dark/Light Theme System & Persistence ---
  const THEME_STORAGE_KEY = 'nptel_quiz_theme';

  function applyTheme(theme, save = true) {
    const isDark = theme === 'dark';
    state.darkMode = isDark;

    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.removeAttribute('data-theme');
      if (themeToggle) {
        themeToggle.setAttribute('aria-checked', 'true');
        themeToggle.setAttribute('title', 'Switch to light theme');
      }
      if (themeToggleLabel) {
        themeToggleLabel.textContent = 'Dark';
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
      if (themeToggle) {
        themeToggle.setAttribute('aria-checked', 'false');
        themeToggle.setAttribute('title', 'Switch to dark theme');
      }
      if (themeToggleLabel) {
        themeToggleLabel.textContent = 'Light';
      }
    }

    if (save) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {
        // LocalStorage might be disabled or full
      }
    }
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (e) {}

    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved, false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light', false);
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        let currentSaved = null;
        try {
          currentSaved = localStorage.getItem(THEME_STORAGE_KEY);
        } catch (err) {}
        if (!currentSaved) {
          applyTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const newTheme = state.darkMode ? 'light' : 'dark';
      applyTheme(newTheme, true);
    });
  }

  // --- Sound Toggle ---
  soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggle.classList.toggle('active', state.soundEnabled);
    if (!state.soundEnabled) {
      soundToggle.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    } else {
      soundToggle.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      playSound('correct');
    }
  });

  // --- Helper: HTML Escaping ---
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize
  initTheme();
  showScreen('setup');
})();
