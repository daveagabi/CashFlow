// speechToText.js
class SpeechToText {
  startRecording() {
    return new Promise((resolve, reject) => {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onresult = (event) => resolve(event.results[0][0].transcript);
      recognition.onerror = reject;
      recognition.start();
    });
  }
}

