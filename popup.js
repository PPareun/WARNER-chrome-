document.getElementById('start').addEventListener('click', function() {
    let audioChunks = [];
    let recentPredictions = [];
    const MAX_SAMPLES = 10;
    const THRESHOLD = 5;

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(function(stream) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        mediaRecorder.ondataavailable = function(e) {
            console.log(audioChunks.length);
            audioChunks.push(e.data);
            if (audioChunks.length > 20) {
                audioChunks.shift(); 
            }
        };

        setInterval(function() {
            mediaRecorder.stop();
            if (audioChunks.length > 0) {
                let blob = new Blob(audioChunks, { type: 'audio/wav' });
                sendDataToServer(blob);
            }
            mediaRecorder.start();
        }, 500);

    })
    .catch(function(err) {
        console.log('Error:', err);
    });

    function sendDataToServer(blob) {
        let formData = new FormData();
        const file = new File([blob], "now.webm", {
            type: "audio/webm",
        });
        formData.append('audioFile', file);

        fetch('http://127.0.0.1:5000/analyze', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            let predictedClass = data.predicted_class;
            
            if (predictedClass !== 'horn' && predictedClass !== 'siren') {
                let icons = {
                    'construction': '🚧',
                    'vehicle': '🚗',
                    'crying': '😭',
                    'scream': '😱',
                    'explosion': '💥',
                    'animal threat': '🐾'
                };

                let iconHTML = `<div class="icon-result"><span class="icon">${icons[predictedClass]}</span><div>${predictedClass}</div></div>`;
                document.getElementById('result').innerHTML = iconHTML;
                return;
            }

            recentPredictions.push(predictedClass);
            if (recentPredictions.length > MAX_SAMPLES) {
                recentPredictions.shift(); 
            }

            let labelCounts = {};
            recentPredictions.forEach(label => {
                if (label in labelCounts) {
                    labelCounts[label]++;
                } else {
                    labelCounts[label] = 1;
                }
            });

            let resultText = '';
            let iconHTML = '';
            let highFrequencyLabel = null;

            for (let label in labelCounts) {
                if (labelCounts[label] >= THRESHOLD) {
                    highFrequencyLabel = label;
                    break;
                }
            }

            if (highFrequencyLabel) {
                iconHTML = `<div class="icon-result"><span class="icon">${icons[highFrequencyLabel]}</span><div>${highFrequencyLabel}</div></div>`;
            } else {
                iconHTML = `<div class="icon-result"><span class="icon">🕊️</span><div>Peaceful</div></div>`;
            }

            document.getElementById('result').innerHTML = resultText + iconHTML;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});
