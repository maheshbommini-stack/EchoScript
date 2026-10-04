const recordBtn = document.getElementById("recordBtn");
const recordLabel = document.getElementById("recordLabel");

const transcriptBox = document.getElementById("transcript");

const timerElement = document.getElementById("timer");

const statusLight = document.getElementById("statusLight");
const statusText = document.getElementById("statusText");
const micStatus = document.getElementById("micStatus");

const waveform = document.getElementById("waveform");

const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");

const wordCountElement = document.getElementById("wordCount");
const sentenceCountElement = document.getElementById("sentenceCount");
const fillerCountElement = document.getElementById("fillerCount");
const repeatCountElement = document.getElementById("repeatCount");

const diversityValue = document.getElementById("diversityValue");
const diversityBar = document.getElementById("diversityBar");

const paceValue = document.getElementById("paceValue");
const paceBar = document.getElementById("paceBar");
const paceDescription = document.getElementById("paceDescription");

const insightTitle = document.getElementById("insightTitle");
const insightText = document.getElementById("insightText");

const lineNumber = document.getElementById("lineNumber");

const toast = document.getElementById("toast");


// ---------------------------------------------
// SPEECH RECOGNITION
// ---------------------------------------------

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

let isRecording = false;

let finalTranscript = "";

let startTime = null;

let timerInterval = null;


// ---------------------------------------------
// CHECK BROWSER SUPPORT
// ---------------------------------------------

if (!SpeechRecognition) {

    recordBtn.disabled = true;

    recordLabel.textContent = "N/A";

    statusText.textContent =
        "SPEECH API UNAVAILABLE";

    micStatus.textContent =
        "Use a browser supporting Web Speech API";

} else {

    recognition = new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";


    // -----------------------------------------
    // SPEECH RESULT
    // -----------------------------------------

    recognition.onresult = function(event) {

        let interimTranscript = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const result = event.results[i];

            const text =
                result[0].transcript;

            if (result.isFinal) {

                finalTranscript +=
                    text + " ";

            } else {

                interimTranscript += text;
            }
        }


        transcriptBox.textContent =
            finalTranscript +
            interimTranscript;


        analyzeTranscript(
            finalTranscript + interimTranscript
        );

        updateLineNumber();
    };


    // -----------------------------------------
    // START
    // -----------------------------------------

    recognition.onstart = function() {

        isRecording = true;

        recordBtn.classList.add("recording");

        recordLabel.textContent = "STOP";

        statusText.textContent =
            "LISTENING";

        micStatus.textContent =
            "Microphone active";

        statusLight.style.background =
            "var(--danger)";

        statusLight.style.boxShadow =
            "0 0 10px var(--danger)";

        waveform.classList.add("active");

        startTimer();
    };


    // -----------------------------------------
    // END
    // -----------------------------------------

    recognition.onend = function() {

        if (isRecording) {

            try {
                recognition.start();
            } catch (error) {
                console.log(error);
            }

        } else {

            stopRecordingInterface();
        }
    };


    // -----------------------------------------
    // ERROR
    // -----------------------------------------

    recognition.onerror = function(event) {

        console.log(
            "Speech recognition error:",
            event.error
        );

        if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
        ) {

            isRecording = false;

            stopRecordingInterface();

            statusText.textContent =
                "MICROPHONE BLOCKED";

            micStatus.textContent =
                "Allow microphone access and try again.";
        }
    };
}


// ---------------------------------------------
// RECORD BUTTON
// ---------------------------------------------

recordBtn.addEventListener("click", () => {

    if (!recognition) {
        return;
    }

    if (!isRecording) {

        finalTranscript = "";

        transcriptBox.textContent = "";

        try {

            recognition.start();

        } catch (error) {

            console.log(error);
        }

    } else {

        isRecording = false;

        try {
            recognition.stop();
        } catch (error) {
            console.log(error);
        }

        stopRecordingInterface();
    }
});


// ---------------------------------------------
// STOP UI
// ---------------------------------------------

function stopRecordingInterface() {

    isRecording = false;

    recordBtn.classList.remove("recording");

    recordLabel.textContent = "START";

    statusText.textContent =
        "SYSTEM READY";

    micStatus.textContent =
        "Microphone inactive";

    statusLight.style.background =
        "var(--accent)";

    statusLight.style.boxShadow =
        "0 0 10px var(--accent)";

    waveform.classList.remove("active");

    stopTimer();

    analyzeTranscript(finalTranscript);
}


// ---------------------------------------------
// TIMER
// ---------------------------------------------

function startTimer() {

    startTime = Date.now();

    timerInterval = setInterval(() => {

        const elapsed =
            Date.now() - startTime;

        const totalSeconds =
            Math.floor(elapsed / 1000);

        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        timerElement.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }, 500);
}


function stopTimer() {

    clearInterval(timerInterval);

    timerInterval = null;
}


// ---------------------------------------------
// ANALYZE TRANSCRIPT
// ---------------------------------------------

function analyzeTranscript(text) {

    if (!text.trim()) {

        resetStats();

        return;
    }


    const words =
        text
            .toLowerCase()
            .match(/\b[a-zA-Z']+\b/g) || [];


    const totalWords =
        words.length;


    // SENTENCES

    const sentences =
        text
            .split(/[.!?]+/)
            .filter(sentence => sentence.trim().length > 0);


    const totalSentences =
        sentences.length;


    // FILLERS

    const fillers = [
        "um",
        "uh",
        "erm",
        "hmm",
        "like",
        "basically",
        "actually",
        "literally",
        "you know",
        "i mean",
        "so"
    ];


    let fillerCount = 0;


    fillers.forEach(filler => {

        const regex =
            new RegExp(
                "\\b" +
                filler.replace(" ", "\\s+") +
                "\\b",
                "gi"
            );

        const matches =
            text.match(regex);

        if (matches) {

            fillerCount +=
                matches.length;
        }
    });


    // REPEATED WORDS

    let repeatCount = 0;

    for (let i = 1; i < words.length; i++) {

        if (words[i] === words[i - 1]) {

            repeatCount++;
        }
    }


    // UNIQUE WORDS

    const uniqueWords =
        new Set(words);


    const diversity =
        totalWords > 0
            ? (uniqueWords.size / totalWords) * 100
            : 0;


    // SPEAKING PACE

    let elapsedMinutes = 0;

    if (startTime) {

        elapsedMinutes =
            (Date.now() - startTime) / 60000;
    }


    let wpm = 0;

    if (elapsedMinutes > 0) {

        wpm =
            Math.round(
                totalWords / elapsedMinutes
            );
    }


    // UPDATE NUMBERS

    wordCountElement.textContent =
        totalWords;

    sentenceCountElement.textContent =
        totalSentences;

    fillerCountElement.textContent =
        fillerCount;

    repeatCountElement.textContent =
        repeatCount;


    diversityValue.textContent =
        Math.round(diversity) + "%";


    diversityBar.style.width =
        Math.min(diversity, 100) + "%";


    paceValue.textContent =
        wpm + " WPM";


    const pacePercentage =
        Math.min(
            (wpm / 180) * 100,
            100
        );


    paceBar.style.width =
        pacePercentage + "%";


    // PACE DESCRIPTION

    if (wpm === 0) {

        paceDescription.textContent =
            "Start speaking to calculate your pace.";

    } else if (wpm < 100) {

        paceDescription.textContent =
            "Your current pace is relatively slow.";

    } else if (wpm <= 150) {

        paceDescription.textContent =
            "Your current pace is in a comfortable range.";

    } else if (wpm <= 180) {

        paceDescription.textContent =
            "Your current pace is moderately fast.";

    } else {

        paceDescription.textContent =
            "Your current pace is fast. Consider slowing down for clarity.";
    }


    generateInsight(
        totalWords,
        fillerCount,
        repeatCount,
        diversity,
        wpm
    );
}


// ---------------------------------------------
// INSIGHT GENERATOR
// ---------------------------------------------

function generateInsight(
    words,
    fillers,
    repeats,
    diversity,
    wpm
) {

    if (words === 0) {

        insightTitle.textContent =
            "Your speech analysis will appear here.";

        insightText.textContent =
            "Start recording and speak naturally. EchoScript will analyze the generated transcript locally in your browser.";

        return;
    }


    if (fillers >= 5) {

        insightTitle.textContent =
            "You use several filler words.";

        insightText.textContent =
            `EchoScript detected ${fillers} filler-word occurrence(s). Pausing briefly before continuing can help make speech sound more deliberate.`;

    } else if (repeats >= 4) {

        insightTitle.textContent =
            "Some words are being repeated.";

        insightText.textContent =
            `The transcript contains ${repeats} consecutive repeated-word occurrence(s). Slowing down slightly may help you organize your thoughts.`;

    } else if (wpm > 180) {

        insightTitle.textContent =
            "Your speaking pace is fast.";

        insightText.textContent =
            `Your estimated pace is ${wpm} WPM. A slightly slower pace can make spoken information easier for listeners to follow.`;

    } else if (diversity < 45 && words > 10) {

        insightTitle.textContent =
            "Your vocabulary diversity is relatively low.";

        insightText.textContent =
            "Try varying your word choices when appropriate to make longer explanations more engaging.";

    } else {

        insightTitle.textContent =
            "Your transcript looks well structured.";

        insightText.textContent =
            `EchoScript analyzed ${words} words with ${Math.round(diversity)}% vocabulary diversity. Keep speaking naturally and clearly.`;
    }
}


// ---------------------------------------------
// LINE NUMBER
// ---------------------------------------------

function updateLineNumber() {

    const text =
        transcriptBox.textContent.trim();

    if (!text) {

        lineNumber.textContent =
            "01";

        return;
    }


    const lines =
        Math.ceil(
            text.length / 75
        );


    lineNumber.textContent =
        String(lines).padStart(2, "0");
}


// ---------------------------------------------
// COPY
// ---------------------------------------------

copyBtn.addEventListener("click", async () => {

    const text =
        transcriptBox.textContent.trim();


    if (
        !text ||
        text === "Your speech transcript will appear here..."
    ) {

        return;
    }


    try {

        await navigator.clipboard.writeText(text);

        showToast("Transcript copied");

    } catch (error) {

        console.log(error);

        showToast("Copy unavailable");
    }
});


// ---------------------------------------------
// CLEAR
// ---------------------------------------------

clearBtn.addEventListener("click", () => {

    finalTranscript = "";

    transcriptBox.textContent =
        "Your speech transcript will appear here...";

    timerElement.textContent =
        "00:00";

    resetStats();

    insightTitle.textContent =
        "Your speech analysis will appear here.";

    insightText.textContent =
        "Start recording and speak naturally. EchoScript will analyze the generated transcript locally in your browser.";

    updateLineNumber();
});


// ---------------------------------------------
// RESET STATS
// ---------------------------------------------

function resetStats() {

    wordCountElement.textContent = "0";

    sentenceCountElement.textContent = "0";

    fillerCountElement.textContent = "0";

    repeatCountElement.textContent = "0";

    diversityValue.textContent = "0%";

    diversityBar.style.width = "0%";

    paceValue.textContent = "0 WPM";

    paceBar.style.width = "0%";

    paceDescription.textContent =
        "Start speaking to calculate your pace.";
}


// ---------------------------------------------
// TOAST
// ---------------------------------------------

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);
      }
