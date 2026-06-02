/* ================================================
   QUIZ BLITZ — quiz.js
   Handles: question loading, timer, scoring,
            feedback, and result screen.
   ================================================ */

// ── Question Bank ─────────────────────────────────
// Each question has: text, an array of 4 options,
// and the index (0-based) of the correct answer.
const ALL_QUESTIONS = [
  {
    question: "What is the capital of Japan?",
    options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
    answer: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answer: 1
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "7", "8", "6"],
    answer: 3
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "Mark Twain", "William Shakespeare", "Homer"],
    answer: 2
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Ag", "Gd", "Go", "Au"],
    answer: 3
  },
  {
    question: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answer: 3
  },
  {
    question: "What year did World War II end?",
    options: ["1943", "1945", "1947", "1950"],
    answer: 1
  },
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
    answer: 2
  },
  {
    question: "Which language is primarily used for web styling?",
    options: ["HTML", "JavaScript", "CSS", "Python"],
    answer: 2
  },
  {
    question: "What is the speed of light (approx)?",
    options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    answer: 0
  },
  {
    question: "Which element has the atomic number 1?",
    options: ["Helium", "Oxygen", "Carbon", "Hydrogen"],
    answer: 3
  },
  {
    question: "How many bones are in the adult human body?",
    options: ["196", "206", "216", "226"],
    answer: 1
  }
];

// ── Configuration ─────────────────────────────────
const TOTAL_QUESTIONS = 10;  // how many questions per quiz
const TIME_LIMIT      = 15;  // seconds per question

// ── State Variables ────────────────────────────────
let questions    = [];   // shuffled subset of ALL_QUESTIONS
let currentIndex = 0;    // which question we're on (0-based)
let score        = 0;    // running score
let timerInterval = null; // reference to the countdown interval
let timeLeft      = TIME_LIMIT;
let answered      = false; // prevents double-answering

// history for the results review section
let history = []; // array of { question, userAnswer, correct, wasTimeout }

// ── DOM References ─────────────────────────────────
const startScreen    = document.getElementById('start-screen');
const quizScreen     = document.getElementById('quiz-screen');
const resultScreen   = document.getElementById('result-screen');

const startBtn       = document.getElementById('start-btn');
const nextBtn        = document.getElementById('next-btn');
const restartBtn     = document.getElementById('restart-btn');

const questionCounter = document.getElementById('question-counter');
const scoreDisplay    = document.getElementById('score-display');
const questionText    = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackBanner  = document.getElementById('feedback-banner');

const timerBar        = document.getElementById('timer-bar');
const timerText       = document.getElementById('timer-text');

const finalScore      = document.getElementById('final-score');
const resultMessage   = document.getElementById('result-message');
const resultEmoji     = document.getElementById('result-emoji');
const reviewList      = document.getElementById('review-list');


// ── Utility: Shuffle Array (Fisher-Yates) ──────────
function shuffle(arr) {
  const a = [...arr]; // clone so we don't mutate original
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Show a specific screen, hide others ───────────
function showScreen(screen) {
  [startScreen, quizScreen, resultScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ── Start the Quiz ─────────────────────────────────
function startQuiz() {
  // Reset state
  score        = 0;
  currentIndex = 0;
  history      = [];

  // Pick a random subset of questions
  questions = shuffle(ALL_QUESTIONS).slice(0, TOTAL_QUESTIONS);

  showScreen(quizScreen);
  loadQuestion();
}

// ── Load the Current Question ─────────────────────
function loadQuestion() {
  const q = questions[currentIndex];

  // Reset UI flags
  answered = false;
  feedbackBanner.classList.add('hidden');
  feedbackBanner.className = 'feedback-banner hidden';
  nextBtn.classList.add('hidden');

  // Update counter and score
  questionCounter.textContent = `Q ${currentIndex + 1} / ${TOTAL_QUESTIONS}`;
  scoreDisplay.textContent    = `Score: ${score}`;

  // Set question text
  questionText.textContent = q.question;

  // Clear old options and render new ones
  optionsContainer.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className   = 'option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(idx));
    optionsContainer.appendChild(btn);
  });

  // Start the 15-second countdown
  startTimer();
}

// ── Timer Logic ────────────────────────────────────
function startTimer() {
  timeLeft = TIME_LIMIT;

  // Reset bar appearance
  timerBar.style.width = '100%';
  timerBar.classList.remove('danger');
  timerText.classList.remove('danger');
  timerText.textContent = timeLeft;

  // Tick every second
  timerInterval = setInterval(() => {
    timeLeft--;

    // Update numeric display and bar width
    timerText.textContent  = timeLeft;
    timerBar.style.width   = `${(timeLeft / TIME_LIMIT) * 100}%`;

    // Apply danger style when ≤ 5 seconds remain
    if (timeLeft <= 5) {
      timerBar.classList.add('danger');
      timerText.classList.add('danger');
    }

    // Time ran out — treat as wrong answer
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// ── Stop the Timer ─────────────────────────────────
function stopTimer() {
  clearInterval(timerInterval);
}

// ── Handle User Selecting an Answer ───────────────
function handleAnswer(selectedIdx) {
  // Ignore clicks if already answered this question
  if (answered) return;
  answered = true;

  stopTimer();

  const q           = questions[currentIndex];
  const isCorrect   = selectedIdx === q.answer;
  const allBtns     = optionsContainer.querySelectorAll('.option-btn');

  // Disable all buttons to lock in the answer
  allBtns.forEach(btn => (btn.disabled = true));

  // Highlight correct answer in green
  allBtns[q.answer].classList.add('correct');

  if (isCorrect) {
    score++;
    allBtns[selectedIdx].classList.add('correct');
    showFeedback('correct', '✅ Correct! Well done.');
  } else {
    // Mark the chosen wrong answer in red
    allBtns[selectedIdx].classList.add('wrong');
    showFeedback('wrong', `❌ Wrong! Correct: "${q.options[q.answer]}"`);
  }

  // Record for review
  history.push({
    question:   q.question,
    userAnswer: q.options[selectedIdx],
    correct:    q.options[q.answer],
    wasTimeout: false,
    wasCorrect: isCorrect
  });

  // Update score display immediately
  scoreDisplay.textContent = `Score: ${score}`;

  // Show "Next" button
  nextBtn.classList.remove('hidden');
}

// ── Handle Timer Running Out ───────────────────────
function handleTimeout() {
  if (answered) return;
  answered = true;

  const q      = questions[currentIndex];
  const allBtns = optionsContainer.querySelectorAll('.option-btn');

  // Disable buttons and reveal the correct answer
  allBtns.forEach(btn => (btn.disabled = true));
  allBtns[q.answer].classList.add('correct');

  showFeedback('timeout', `⏰ Time's up! Answer: "${q.options[q.answer]}"`);

  // Record as timeout
  history.push({
    question:   q.question,
    userAnswer: '—',
    correct:    q.options[q.answer],
    wasTimeout: true,
    wasCorrect: false
  });

  nextBtn.classList.remove('hidden');
}

// ── Show Feedback Banner ───────────────────────────
function showFeedback(type, message) {
  feedbackBanner.textContent  = message;
  feedbackBanner.className    = `feedback-banner ${type}-fb`; // correct-fb / wrong-fb / timeout-fb
}

// ── Move to Next Question or Show Results ─────────
function nextQuestion() {
  currentIndex++;

  if (currentIndex < TOTAL_QUESTIONS) {
    loadQuestion();
  } else {
    showResults();
  }
}

// ── Build and Show Result Screen ──────────────────
function showResults() {
  showScreen(resultScreen);

  const percent = Math.round((score / TOTAL_QUESTIONS) * 100);

  // Choose emoji and message based on score
  let emoji, message;
  if (percent === 100) {
    emoji = '🏆'; message = 'Perfect score! You\'re a genius!';
  } else if (percent >= 80) {
    emoji = '🌟'; message = 'Excellent! Almost perfect!';
  } else if (percent >= 60) {
    emoji = '👍'; message = 'Good job! Keep practising.';
  } else if (percent >= 40) {
    emoji = '📚'; message = 'Not bad. A little more study needed!';
  } else {
    emoji = '💪'; message = 'Keep trying — you\'ll improve!';
  }

  resultEmoji.textContent   = emoji;
  finalScore.textContent    = `${score} / ${TOTAL_QUESTIONS}`;
  resultMessage.textContent = `${percent}% — ${message}`;

  // Build the review list from history
  reviewList.innerHTML = '';
  history.forEach((item, idx) => {
    const div = document.createElement('div');

    // Add class based on outcome
    let cls = item.wasCorrect ? 'rev-correct' : (item.wasTimeout ? 'rev-timeout' : 'rev-wrong');
    div.className = `review-item ${cls}`;

    const icon = item.wasCorrect ? '✅' : (item.wasTimeout ? '⏰' : '❌');
    div.innerHTML = `
      <div class="rev-q">Q${idx + 1}: ${item.question}</div>
      <div class="rev-a">${icon} Your answer: ${item.userAnswer} &nbsp;|&nbsp; Correct: ${item.correct}</div>
    `;
    reviewList.appendChild(div);
  });
}

// ── Event Listeners ────────────────────────────────
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', startQuiz);
