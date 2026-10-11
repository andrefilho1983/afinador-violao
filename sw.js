// 1. Importando o Pitchfinder direto de um CDN compatível com navegadores
import { YIN } from 'https://cdn.skypack.dev/pitchfinder';

// Variáveis e Configurações
let audioContext;
let analyser;
let microphone;
let detectPitch;
const FFT_SIZE = 2048; 
let audioBuffer;

// Base de dados de afinação
const standardTuning = [
  { name: 'E (6ª)', freq: 82.41 },
  { name: 'A (5ª)', freq: 110.00 },
  { name: 'D (4ª)', freq: 146.83 },
  { name: 'G (3ª)', freq: 196.00 },
  { name: 'B (2ª)', freq: 246.94 },
  { name: 'E (1ª)', freq: 329.63 }
];

// Elementos da Interface
const startBtn = document.getElementById('start-btn');
const tunerUi = document.getElementById('tuner-ui');
const noteDisplay = document.getElementById('note-display');
const instructionText = document.getElementById('instruction-text');
const pointer = document.getElementById('pointer');

// 2. O evento de clique no botão "Ligar Afinador"
startBtn.addEventListener('click', async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    audioBuffer = new Float32Array(analyser.fftSize);
    detectPitch = YIN({ sampleRate: audioContext.sampleRate });
    
    // Esconde o botão e revela a interface do afinador
    startBtn.style.display = 'none';
    tunerUi.classList.remove('opacity-0');
    tunerUi.classList.add('opacity-100');

    // Inicia a "escuta"
    processAudio();

  } catch (err) {
    alert("Erro ao acessar o microfone. Verifique as permissões do navegador.");
    console.error(err);
  }
});

// 3. Funções Matemáticas
function getClosestString(pitchInHz) {
  let closestString = standardTuning[0];
  let minDiff = Math.abs(pitchInHz - standardTuning[0].freq);
  for (let i = 1; i < standardTuning.length; i++) {
    let diff = Math.abs(pitchInHz - standardTuning[i].freq);
    if (diff < minDiff) {
      minDiff = diff;
      closestString = standardTuning[i];
    }
  }
  return closestString;
}

function getCentsOffPitch(pitchInHz, targetFreq) {
  return Math.floor(1200 * Math.log2(pitchInHz / targetFreq));
}

// 4. Loop Contínuo de Áudio
function processAudio() {
  analyser.getFloatTimeDomainData(audioBuffer);
  const pitchInHz = detectPitch(audioBuffer);
  
  if (pitchInHz && pitchInHz > 70 && pitchInHz < 1000) {
    const targetString = getClosestString(pitchInHz);
    const cents = getCentsOffPitch(pitchInHz, targetString.freq);
    updateTunerUI(targetString.name, cents);
  }
  
  requestAnimationFrame(processAudio);
}

// 5. Atualização Visual da Tela
function updateTunerUI(noteName, cents) {
  noteDisplay.textContent = noteName;
  let position = 50 + cents;
  position = Math.max(0, Math.min(100, position)); 
  pointer.style.left = `${position}%`;

  if (Math.abs(cents) <= 3) {
    pointer.classList.replace('bg-red-500', 'bg-green-500') || pointer.classList.replace('bg-yellow-500', 'bg-green-500');
    noteDisplay.classList.add('text-green-500');
    instructionText.textContent = "Afinado!";
    instructionText.classList.replace('text-gray-400', 'text-green-400');
  } else {
    pointer.classList.replace('bg-green-500', 'bg-red-500');
    noteDisplay.classList.remove('text-green-500');
    instructionText.classList.replace('text-green-400', 'text-gray-400');
    
    if (cents < -3) {
      instructionText.textContent = "Aperte a corda";
    } else {
      instructionText.textContent = "Solte a corda";
    }
  }
}
