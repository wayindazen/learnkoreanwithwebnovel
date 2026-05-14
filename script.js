// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let storyData = {};
let grammarData = {};
let stickerZIndex = 100;
let authorMode = false; 

let gameState = {
    character: null,
    currentChapter: 1,
    userProgress: { yona: 1, yonu: 1, sera: 1, genji: 1 }, 
    progress: {
        yona: { history: [], currentIndex: -1 },
        yonu: { history: [], currentIndex: -1 },
        sera: { history: [], currentIndex: -1 },
        genji: { history: [], currentIndex: -1 }
    }
};

// --- ЛОГИКА ЯЗЫКОВ ---
let currentLang = localStorage.getItem('selectedLang') || 'en';

const uiTranslations = {
    en: {
        scopeCurr: "This section",
        scopeAll: "Whole story",
        modeWords: "Words only",
        modeGrammar: "Grammar only",
        modeMixed: "Mixed",
        startBtn: "START",
        resetBtn: "RESET PROGRESS",
        resetConfirm: "Are you sure you want to reset all progress? This cannot be undone.",
        resultTitle: "Result"
    },
    ru: {
        scopeLabel: "Область поиска:", // Новый ключ
        modesLabel: "Режимы:",       // Новый ключ
        scopeCurr: "Этот раздел",
        scopeAll: "Вся история",
        modeWords: "Только слова",
        modeGrammar: "Грамматика",
        modeMixed: "Слова и Грамматика",
        startBtn: "НАЧАТЬ",
        resetBtn: "СБРОС ПРОГРЕССА",
        resetConfirm: "Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.",
        resultTitle: "Результат"
    }
};

const charProfiles = {
    genji: { name: "겐지", realname: "(가명)", age: "나이: 29", job: "직업: 음악 프로듀서" },
    yona: { name: "서요나", realname: "(본명)", age: "나이: 24", job: "직업: 대학원생" },
    yonu: { name: "강연우 / Invader", realname: "(본명 / 가명)", age: "나이: 27", job: "직업: 프로 게이머" },
    sera: { name: "임세라", realname: "(본명)", age: "나이: 25", job: "직업: 프리랜서 작가" }
};

// === 1. ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Загрузка сохранений из localStorage
    const saved = localStorage.getItem('korean_story_save');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.userProgress) gameState.userProgress = parsed.userProgress; 
            if (parsed.progress) gameState.progress = parsed.progress;
            if (parsed.character) gameState.character = parsed.character;
            if (parsed.currentChapter) gameState.currentChapter = parsed.currentChapter;
        } catch(e) { console.warn("Save load failed"); }
    }

    // 2. Настройка тумблера языка (EN/RU)
    const langCheckbox = document.getElementById('language-checkbox');
    if (langCheckbox) {
        langCheckbox.checked = (currentLang === 'ru');
        langCheckbox.addEventListener('change', async function() {
            currentLang = this.checked ? 'ru' : 'en';
            localStorage.setItem('selectedLang', currentLang);
            await loadGrammarData(); // Перезагружаем файл слов (grammar.json или grammarrus.json)
            updateInterfaceTexts();  // Переводим кнопки квиза и интерфейс
        });
    }

    // 3. ЗАГРУЗКА ДАННЫХ
    try {
        // А) Авто-восстановление истории (если персонаж уже выбран в сохранении)
        if (gameState.character) {
            const storyRes = await fetch(`story_${gameState.character}.json?` + Date.now());
            const data = await storyRes.json();
            // Наполняем storyData данными только этого персонажа
            storyData[gameState.character] = data[gameState.character];
            console.log(`История для ${gameState.character} восстановлена`);
        }

        // Б) Загрузка грамматики (зависит от выбранного языка)
        await loadGrammarData();
        
        // В) Перевод интерфейса
        updateInterfaceTexts();

        console.log("Инициализация завершена");
    } catch (e) { 
        console.error("Ошибка при первичной загрузке данных", e); 
    }

    // 4. Настройка переключателей и событий
    const toggle = document.getElementById('analysis-toggle');
    if (toggle) toggle.onchange = handleToggle;

    // Инициализация событий квиза
    initQuizEvents();
});

// Функция загрузки нужного файла грамматики
async function loadGrammarData() {
    const fileName = (currentLang === 'ru') ? 'grammarrus.json' : 'grammar.json';
    try {
        const res = await fetch(fileName + '?' + Date.now());
        grammarData = await res.json();
    } catch (e) { console.error("Ошибка загрузки файла грамматики: " + fileName); }
}

// Функция перевода текстов интерфейса
function updateInterfaceTexts() {
    const t = uiTranslations[currentLang];
    
    // Перевод заголовков Scope и Modes
    const scopeLabel = document.getElementById('quiz-label-scope');
    if (scopeLabel) scopeLabel.textContent = t.scopeLabel;

    const modesLabel = document.getElementById('quiz-label-modes');
    if (modesLabel) modesLabel.textContent = t.modesLabel;

    // Перевод кнопки сброса
    const resetBtn = document.getElementById('reset-progress-btn');
    if (resetBtn) resetBtn.textContent = t.resetBtn;

    // Опции квиза (Scope)
    const scopeBtns = document.querySelectorAll('.quiz-scope');
    if (scopeBtns.length >= 2) {
        scopeBtns[0].textContent = t.scopeCurr;
        scopeBtns[1].textContent = t.scopeAll;
    }

    // Режимы квиза
    const modeBtns = document.querySelectorAll('.quiz-mode');
    if (modeBtns.length >= 3) {
        modeBtns[0].textContent = t.modeWords;
        modeBtns[1].textContent = t.modeGrammar;
        modeBtns[2].textContent = t.modeMixed;
    }

    // Кнопка старт и заголовки
    const startBtn = document.getElementById('btn-quiz-start');
    if (startBtn) startBtn.textContent = t.startBtn;

    const resTitle = document.querySelector('#quiz-result-screen .quiz-title');
    if (resTitle) resTitle.textContent = t.resultTitle;
}

function saveGame() {
    localStorage.setItem('korean_story_save', JSON.stringify(gameState));
}


// === 2. НАВИГАЦИЯ ===

async function selectCharacter(charId) {
    // Показываем какой-нибудь индикатор загрузки, если хочешь, 
    // но текстовый файл качается быстро.
    
    try {
        const res = await fetch(`story_${charId}.json?` + Date.now());
        const data = await res.json();
        
        // Добавляем данные персонажа в общую переменную storyData
        storyData[charId] = data[charId]; 
        
        console.log(`История для ${charId} загружена`);
    } catch (e) {
        console.error(`Не удалось загрузить историю для ${charId}`, e);
        alert("Ошибка загрузки истории!");
        return;
    }

    gameState.character = charId;
    const startScreen = document.getElementById('start-screen');
    startScreen.style.opacity = '0';
    
    setTimeout(() => {
        startScreen.classList.add('hidden');
        const profile = charProfiles[charId];
        document.getElementById('map-char-img').src = charId + ".jpg";
        document.getElementById('map-char-name-display').textContent = profile.name;
        document.getElementById('profile-realname').textContent = profile.realname;
        document.getElementById('profile-age').textContent = profile.age;
        document.getElementById('profile-job').textContent = profile.job;
        initMap(charId);
    }, 600);
}

function initMap(charId) {
    const mapScreen = document.getElementById('map-screen');
    mapScreen.classList.remove('hidden');
    const nodesCont = document.getElementById('chapters-nodes');
    const svgCont = document.getElementById('map-lines');
    nodesCont.innerHTML = ''; svgCont.innerHTML = '';
    
    const centerX = 350, centerY = 240;
    const radiusX = 280, radiusY = 200;
    const unlocked = gameState.userProgress[charId];

    const centerWrapper = document.createElement('div');
    centerWrapper.className = 'center-node';
    centerWrapper.innerHTML = `
        <div class="split-half half-1 unlocked" onclick="startChapter('${charId}', 1)"><span>1</span></div>
        <div class="split-half half-6 ${unlocked >= 6 ? 'unlocked' : ''}"><span>6</span></div>
    `;
    if (unlocked >= 6) {
        centerWrapper.querySelector('.half-6').onclick = () => startChapter(charId, 6);
    }
    nodesCont.appendChild(centerWrapper);

    const points = [];
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        points.push({
            x: centerX + radiusX * Math.cos(angle),
            y: centerY + radiusY * Math.sin(angle)
        });
    }

    for (let i = 0; i < 12; i++) {
        const s = points[i], e = points[(i + 1) % 12];
        createSvgLine(s.x, s.y, e.x, e.y, "background-line");
    }
    [0, 3, 6, 9].forEach(idx => {
        createSvgLine(centerX, centerY, points[idx].x, points[idx].y, "background-line");
    });

    createSvgLine(centerX, centerY, points[0].x, points[0].y, unlocked >= 2 ? "bright-line" : "active-path");
    createSvgLine(points[0].x, points[0].y, points[1].x, points[1].y, unlocked >= 3 ? "bright-line" : "active-path");
    createSvgLine(points[1].x, points[1].y, points[2].x, points[2].y, unlocked >= 4 ? "bright-line" : "active-path");
    createSvgLine(points[2].x, points[2].y, points[3].x, points[3].y, unlocked >= 5 ? "bright-line" : "active-path");
    createSvgLine(points[3].x, points[3].y, centerX, centerY, unlocked >= 6 ? "bright-line" : "active-path");

    points.forEach((pt, i) => {
        const node = document.createElement('div');
        node.className = 'chapter-node';
        node.style.left = pt.x + 'px';
        node.style.top = pt.y + 'px';

        let chapterNum = null;
        if (i === 0) chapterNum = 2;
        if (i === 1) chapterNum = 3;
        if (i === 2) chapterNum = 4;
        if (i === 3) chapterNum = 5;

        if (chapterNum) {
            node.textContent = chapterNum;
            node.classList.add('active-zone');
            if (Number(chapterNum) <= Number(unlocked)) {
                node.classList.add('unlocked');
                node.onclick = () => startChapter(charId, chapterNum);
            }
        }
        nodesCont.appendChild(node);
    });

    function createSvgLine(x1, y1, x2, y2, className) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1); line.setAttribute("y1", y1);
        line.setAttribute("x2", x2); line.setAttribute("y2", y2);
        line.classList.add(className);
        svgCont.appendChild(line);
    }
}

function backToMap() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('map-screen').classList.remove('hidden');
    initMap(gameState.character);
    document.getElementById('stickers-container').innerHTML = '';
}

// === 3. ДВИЖОК СЮЖЕТА ===

function startChapter(charId, chapterNum) {
    gameState.character = charId;
    gameState.currentChapter = chapterNum;
    
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    const charProg = gameState.progress[charId];
    const chapterKey = "ch" + chapterNum;

    let lastKnownNodeIndex = -1;
    for (let i = charProg.history.length - 1; i >= 0; i--) {
        const nodeId = charProg.history[i];
        if (storyData[charId][chapterKey] && storyData[charId][chapterKey].nodes[nodeId]) {
            lastKnownNodeIndex = i;
            break; 
        }
    }

    if (lastKnownNodeIndex !== -1) {
        charProg.currentIndex = lastKnownNodeIndex;
    } else {
        const firstNodeId = storyData[charId][chapterKey].start_node;
        charProg.history.push(firstNodeId);
        charProg.currentIndex = charProg.history.length - 1;
    }
    
    renderCurrentNode();
}

function renderCurrentNode() {
    const charId = gameState.character;
    const charProg = gameState.progress[charId];
    const nodeId = charProg.history[charProg.currentIndex];

    let node = null;
    let foundChapterNum = gameState.currentChapter;

    for (let chKey in storyData[charId]) {
        if (storyData[charId][chKey].nodes && storyData[charId][chKey].nodes[nodeId]) {
            node = storyData[charId][chKey].nodes[nodeId];
            foundChapterNum = parseInt(chKey.replace("ch", ""));
            break;
        }
    }

    if (!node) return;

    if (foundChapterNum > gameState.userProgress[charId]) {
        gameState.userProgress[charId] = foundChapterNum;
        saveGame();
    }

    gameState.currentChapter = foundChapterNum;
    const bgPath = `backgrounds/${charId}/${foundChapterNum}.jpg`;
    const bgUrl = `url('${bgPath}')`;

    document.getElementById('story-side').style.backgroundImage = bgUrl;
    document.getElementById('sticker-board').style.backgroundImage = bgUrl;
    document.getElementById('chapter-title').textContent = `${foundChapterNum}장`;

  // 1. Отрисовка текста (с поддержкой Блоков и расширенных условий)
    const textDisplay = document.getElementById('text-display');
    textDisplay.innerHTML = '';

    if (node.text) {
        // Универсальная функция обработки сегментов
        const processSegments = (segments) => {
            segments.forEach(seg => {
                // --- ПРОВЕРКИ ВКЛЮЧЕНИЯ (ПОКАЗАТЬ, ЕСЛИ...) ---
                if (seg.require && !charProg.history.includes(seg.require)) return;
                if (seg.require_all && !seg.require_all.every(id => charProg.history.includes(id))) return;
                if (seg.require_any && !seg.require_any.some(id => charProg.history.includes(id))) return;

                // --- ПРОВЕРКИ ИСКЛЮЧЕНИЯ (СКРЫТЬ, ЕСЛИ...) ---
                // Скрыть, если БЫЛ этот узел
                if (seg.exclude && charProg.history.includes(seg.exclude)) return;

                // Скрыть, если БЫЛ хотя бы ОДИН из списка
                if (seg.exclude_any && seg.exclude_any.some(id => charProg.history.includes(id))) return;

                // Скрыть, если БЫЛИ сделаны ВСЕ выборы из списка
                if (seg.exclude_all && seg.exclude_all.every(id => charProg.history.includes(id))) return;


                // --- ЛОГИКА ОТРИСОВКИ ---
                // Обработка вложенных блоков
                if (seg.block) {
                    processSegments(seg.block); 
                    return;
                }

                // Отрисовка обычного текстового сегмента
                if (seg.t) {
                    const span = document.createElement('span');
                    span.textContent = seg.t;
                    if (seg.ids) {
                        span.className = "segment";
                        span.onclick = (e) => seg.ids.forEach((id, i) => createSticker(id, i * 130));
                    }
                    textDisplay.appendChild(span);
                }
            });
        };

        processSegments(node.text);
    }

    const choicesCont = document.getElementById('choices-container');
    choicesCont.innerHTML = '';
    const isAtTheEnd = (charProg.currentIndex === charProg.history.length - 1);

    if (node.choices) {
        node.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = "choice-btn";
            btn.textContent = choice.text;

            if (!isAtTheEnd && !authorMode) {
                btn.classList.add('disabled-choice');
                if (choice.next_id === charProg.history[charProg.currentIndex + 1]) btn.classList.add('made-choice');
            } else {
                btn.onclick = () => makeChoice(choice.next_id, choice.next_chapter);
                if (choice.next_id === charProg.history[charProg.currentIndex + 1]) btn.classList.add('made-choice');
            }
            choicesCont.appendChild(btn);
        });
    }

    document.getElementById('nav-prev-node').style.display = (charProg.currentIndex > 0) ? 'flex' : 'none';
    document.getElementById('nav-next-node').style.display = (charProg.currentIndex < charProg.history.length - 1) ? 'flex' : 'none';

    saveGame();
    document.getElementById('text-area-box').scrollTop = 0;
}

function makeChoice(nextNodeId, nextChapterNum = null) {
    const charId = gameState.character;
    const charProg = gameState.progress[charId];
    if (nextChapterNum && nextChapterNum > gameState.userProgress[charId]) {
        gameState.userProgress[charId] = nextChapterNum;
    }
    if (charProg.currentIndex < charProg.history.length - 1) {
        charProg.history = charProg.history.slice(0, charProg.currentIndex + 1);
    }
    charProg.history.push(nextNodeId);
    charProg.currentIndex++;
    saveGame();
    renderCurrentNode();
}

function navigateHistory(direction) {
    const charId = gameState.character;
    const charProg = gameState.progress[charId];
    const newIndex = charProg.currentIndex + direction;
    if (newIndex >= 0 && newIndex < charProg.history.length) {
        charProg.currentIndex = newIndex;
        renderCurrentNode();
    }
}

// === 4. ОБРАБОТЧИКИ И СТИКЕРЫ ===

function handleToggle() {
    const isChecked = document.getElementById('analysis-toggle').checked;
    const gameScreen = document.getElementById('game-screen');
    if (isChecked) {
        gameScreen.classList.add('analysis-on');
        document.getElementById('text-display').classList.add('active-analysis');
    } else {
        gameScreen.classList.remove('analysis-on');
        document.getElementById('text-display').classList.remove('active-analysis');
        document.getElementById('stickers-container').innerHTML = '';
    }
}

function createSticker(id, yOffset = 0) {
    const data = grammarData[id]; // Здесь данные уже будут из en или ru
    if (!data) return;
    const container = document.getElementById('stickers-container');
    const sticker = document.createElement('div');
    sticker.className = 'sticker';
    stickerZIndex++;
    sticker.style.zIndex = stickerZIndex;
    sticker.style.top = (30 + yOffset) + 'px';
    sticker.style.left = '5%';
    const dotClass = data.category === 'grammar' ? 'dot-grammar' : 'dot-lexicon';
    sticker.innerHTML = `
        <span class="close-sticker" onclick="this.parentElement.remove()">✖</span>
        <div class="sticker-handle" style="cursor: grab; display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 5px;">
            <span class="sticker-dot ${dotClass}"></span>
            <strong style="color:#000; font-size: 1.1rem;">${data.word}</strong>
        </div>
        <div class="sticker-content" style="margin-top:8px; font-size:0.95rem; color:#444; line-height: 1.4;">
            ${data.meanings.map(m => `• ${m}`).join('<br>')}
        </div>
    `;
    container.appendChild(sticker);
    makeDraggable(sticker);
}

function makeDraggable(el) {
    let isDragging = false;
    let offsetX, offsetY;
    const handle = el.querySelector('.sticker-handle');
    handle.addEventListener("mousedown", (e) => {
        isDragging = true;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        el.style.cursor = "grabbing";
        stickerZIndex++;
        el.style.zIndex = stickerZIndex;
    });
    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const board = document.getElementById("sticker-board");
        const boardRect = board.getBoundingClientRect();
        let x = e.clientX - boardRect.left - offsetX;
        let y = e.clientY - boardRect.top - offsetY;
        x = Math.max(0, Math.min(x, board.offsetWidth - el.offsetWidth));
        y = Math.max(0, Math.min(y, board.offsetHeight - el.offsetHeight));
        el.style.left = x + "px"; el.style.top = y + "px";
    });
    document.addEventListener("mouseup", () => { isDragging = false; el.style.cursor = "default"; });
}

// === ЛОГИКА КВИЗА (КОПИЯ 1 В 1 + НОВЫЙ ИСТОЧНИК СЛОВ) ===

let currentQuizPool = [], quizQuestions = [], quizStep = 0, quizScore = 0;
let quizScope = 'current', quizMode = 'words', quizAnswered = false;

// Делаем функции глобальными
window.openQuiz = function() {
    document.getElementById('quiz-overlay').classList.remove('hidden');
    document.getElementById('quiz-start-screen').classList.remove('hidden');
    document.getElementById('quiz-game-screen').classList.add('hidden');
    document.getElementById('quiz-result-screen').classList.add('hidden');
};

window.closeQuiz = function() {
    document.getElementById('quiz-overlay').classList.add('hidden');
    document.getElementById('stickers-container').innerHTML = ''; 
};

function initQuizEvents() {
    document.getElementById('btn-quiz-start').onclick = startQuiz;
    document.getElementById('quiz-next-btn').onclick = nextQuestion;
    document.getElementById('quiz-input-submit').onclick = checkInputAnswer;
document.getElementById('quiz-input-field').onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Чтобы не срабатывали лишние события
            checkInputAnswer();
        }
    };
    document.querySelectorAll('.quiz-scope').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.quiz-scope').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); quizScope = btn.dataset.scope;
        };
    });

    document.querySelectorAll('.quiz-mode').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.quiz-mode').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); quizMode = btn.dataset.mode;
        };
    });
}

function startQuiz() {
    const charId = gameState.character, charProg = gameState.progress[charId];
    const chapterKey = "ch" + gameState.currentChapter;
    let nodesToScan = (quizScope === 'current') ? [charProg.history[charProg.currentIndex]] : charProg.history;

    let wordIdsPool = new Set();
    nodesToScan.forEach(nodeId => {
        const node = storyData[charId][chapterKey].nodes[nodeId];
        if (node && node.text) node.text.forEach(seg => {
            if (seg.ids) seg.ids.forEach(id => wordIdsPool.add(id));
        });
    });

    let filteredPool = [];
    wordIdsPool.forEach(id => {
        const data = grammarData[id];
        if (data && data.category) {
            if (quizMode === 'words' && data.category !== 'lexicon') return;
            if (quizMode === 'grammar' && data.category !== 'grammar') return;
            filteredPool.push({ id, ...data });
        }
    });

    if (filteredPool.length < 4) { alert("Need more words!"); return; }

    currentQuizPool = filteredPool; quizStep = 0; quizScore = 0;
    generateQuizQuestions();
    document.getElementById('quiz-start-screen').classList.add('hidden');
    document.getElementById('quiz-game-screen').classList.remove('hidden');
    renderQuizQuestion();
}

function generateQuizQuestions() {
    quizQuestions = [];
    let shuffled = [...currentQuizPool].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < 8; i++) {
        let target = shuffled[i % shuffled.length];
        let type = 'mc'; 
        let direction = Math.random() > 0.5 ? 'kr_en' : 'en_kr';

        if (quizMode !== 'grammar' && i >= 6) {
            const lexPool = currentQuizPool.filter(x => x.category === 'lexicon');
            if (lexPool.length > 0) target = lexPool[Math.floor(Math.random() * lexPool.length)];
            type = 'input'; direction = 'en_kr'; 
        }
        quizQuestions.push({ target, type, direction });
    }
}

function renderQuizQuestion() {
    quizAnswered = false;
    const q = quizQuestions[quizStep], textField = document.getElementById('quiz-question-text'), optionsCont = document.getElementById('quiz-options-container'), inputCont = document.getElementById('quiz-input-container'), nextBtn = document.getElementById('quiz-next-btn');
    
    nextBtn.classList.remove('hidden');
    textField.innerHTML = (q.type === 'input' || q.direction === 'en_kr') ? q.target.meanings.join(', ') : q.target.word;

    if (q.type === 'mc') {
        inputCont.style.display = 'none'; optionsCont.style.display = 'grid'; optionsCont.innerHTML = '';
        let distractors = Object.keys(grammarData)
            .filter(id => id !== q.target.id && grammarData[id].category === q.target.category)
            .map(id => ({ id, ...grammarData[id] }))
            .sort(() => 0.5 - Math.random()).slice(0, 5);
        
        let options = [q.target, ...distractors].sort(() => 0.5 - Math.random());
        options.forEach(opt => {
            const btn = document.createElement('div'); btn.className = 'quiz-answer';
            btn.innerHTML = q.direction === 'kr_en' ? opt.meanings.join(', ') : opt.word;
            btn.onclick = () => checkMCAnswer(btn, opt.id === q.target.id);
            optionsCont.appendChild(btn);
        });
    } else {
        optionsCont.style.display = 'none'; inputCont.style.display = 'flex';
        const field = document.getElementById('quiz-input-field');
        field.value = ''; field.className = ''; 
    }
}

function checkMCAnswer(btn, isCorrect) {
    if (quizAnswered) return; quizAnswered = true;
    if (isCorrect) { btn.classList.add('correct'); quizScore++; }
    else {
        btn.classList.add('wrong'); createSticker(quizQuestions[quizStep].target.id, 0);
        Array.from(document.querySelectorAll('.quiz-answer')).forEach(b => {
            const corr = quizQuestions[quizStep].target;
            if (b.innerHTML === corr.word || b.innerHTML === corr.meanings.join(', ')) b.classList.add('correct');
        });
    }
}

function checkInputAnswer() {
    if (quizAnswered) return; 

    const field = document.getElementById('quiz-input-field');
    const q = quizQuestions[quizStep];
    const userVal = field.value.replace(/\s/g, '').toLowerCase();
    const variants = q.target.word.split('/').map(v => v.replace(/\s/g, '').toLowerCase());

    quizAnswered = true; 

    if (variants.includes(userVal)) {
        field.classList.add('correct');
        quizScore++;
    } else {
        field.classList.add('wrong');
        createSticker(q.target.id, 0); // Стикер только при ошибке
    }
}

// 3. Функция "Далее" (просто переходит, ничего не проверяя)
function nextQuestion() {
    document.getElementById('stickers-container').innerHTML = ''; // Чистим стикеры
    quizStep++;
    if (quizStep < quizQuestions.length) {
        renderQuizQuestion();
    } else {
        showQuizResults();
    }
}

// Вынес саму логику перехода в отдельную подфункцию для удобства задержки
function proceedToNext() {
    document.getElementById('stickers-container').innerHTML = ''; // Удаляем стикеры
    quizStep++;
    if (quizStep < quizQuestions.length) {
        renderQuizQuestion();
    } else {
        showQuizResults();
    }
}

function showQuizResults() {
    document.getElementById('quiz-game-screen').classList.add('hidden');
    document.getElementById('quiz-result-screen').classList.remove('hidden');
    document.getElementById('quiz-final-score').textContent = `${quizScore} / ${quizQuestions.length}`;
}
function resetGame() {
    const t = uiTranslations[currentLang];
    if (confirm(t.resetConfirm)) {
        // 1. Удаляем сохранение из браузера
        localStorage.removeItem('korean_story_save');
        
        // 2. Очищаем выбранный язык (опционально, можно оставить)
        // localStorage.removeItem('selectedLang'); 
        
        // 3. Перезагружаем страницу, чтобы обнулить память (gameState)
        location.reload();
    }
}
