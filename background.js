chrome.browserAction.onClicked.addListener((tab) => {
    chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
      if (chrome.runtime.lastError) {
        console.error(`Error: ${chrome.runtime.lastError.message}`);
        alert('Audio capture permission was denied.');
        return;
      }
  
      console.log('Audio capture started');
      let audioContext = new (window.AudioContext || window.webkitAudioContext)();
      let source = audioContext.createMediaStreamSource(stream);
      let analyser = audioContext.createAnalyser();
  
      source.connect(analyser);
      analyser.fftSize = 2048;
      let bufferLength = analyser.frequencyBinCount;
      let dataArray = new Uint8Array(bufferLength);
  
      function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
  
        // 여기에 캔버스에 오디오 파형을 그리는 코드를 추가하세요.
        console.log(dataArray);
      }
  
      draw();
    });
  });
  