let intervalId; 

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.command == "scroll") {
        if (intervalId) clearInterval(intervalId); 
        intervalId = setInterval(() => {
          adjustScrollSpeed(request.expression);
        }, 100);
      }
    }
);

function adjustScrollSpeed(expression) {
    let scrollSpeed = 100; 
    window.scrollBy(0, expression['happy'] * 0.1);
}
