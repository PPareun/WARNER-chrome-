navigator.mediaDevices.getUserMedia({
  audio: true
}).then(stream => {
  document.querySelector('#status').innerHTML =
    'Microphone access granted for extension, please close this tab';
  chrome.storage.local.set({
    'micAccess': true
  }, () => {});
})
.catch(err => {
  document.querySelector('#status').innerHTML =
    'Error getting microphone access for extension: ' + err.toString();
  console.error(err);
});
