import { YIN } from 'https://cdn.skypack.dev/pitchfinder';

let audioContext, analyser, microphone, detectPitch, audioBuffer;
const FFT_SIZE = 2048; 

const standardTuning = [
  { name: 'E', freq: 82.41 }, { name: 'A', freq: 110.00 },
  { name: 'D', freq: 146.83 }, { name: 'G', freq: 196.00 },
  { name: 'B', freq: 246.94 }, { name: 'E', freq: 329.63 }
];

const startBtn = document.getElementById('start-btn');
const tunerUi = document.getElementById('tuner-ui');
const noteDisplay = document.getElementById('note-display');
const instructionText = document.getElementById('instruction-text');
const pointer = document.getElementById('pointer');
const freqDisplay = document.getElementById('freq-display'); // NOVO ELEMENTO

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
    
    startBtn.style.display = 'none';
    tunerUi.classList.remove('hidden');
    // Pequeno atraso para a animação de fade-in funcionar
    setTimeout(() => tunerUi.classList.remove('opacity-0'), 50);

    processAudio();
  } catch (err) {
    alert("Erro ao acessar microfone.");
  }
});

function getClosestString(pitchInHz) {
  return standardTuning.reduce((prev, curr) => 
    Math.abs(curr.freq - pitchInHz) < Math.abs(prev.freq - pitchInHz) ? curr : prev
  );
}

function getCentsOffPitch(pitchInHz, targetFreq) {
  return Math.floor(1200 * Math.log2(pitchInHz / targetFreq));
}

function processAudio() {
  analyser.getFloatTimeDomainData(audioBuffer);
  const pitchInHz = detectPitch(audioBuffer);
  
  if (pitchInHz && pitchInHz > 70 && pitchInHz < 1000) {
    const targetString = getClosestString(pitchInHz);
    const cents = getCentsOffPitch(pitchInHz, targetString.freq);
    
    // Agora enviamos também a frequência exata (pitchInHz) para a interface
    updateTunerUI(targetString.name, cents, pitchInHz);
  }
  
  requestAnimationFrame(processAudio);
}

function updateTunerUI(noteName, cents, pitchInHz) {
  noteDisplay.textContent = noteName;
  
  // Exibe a frequência formatada com 1 casa decimal (ex: 110.4 Hz)
  freqDisplay.textContent = pitchInHz.toFixed(1) + " Hz";

  // Mapeia os cents para a agulha. De -50 a +50cents mapeados de 0% a 100% da largura
  let position = 50 + cents;
  position = Math.max(5, Math.min(95, position)); // Evita que a agulha vaze da caixa
  pointer.style.left = `${position}%`;

  // Limpa as cores anteriores da agulha e da nota
  pointer.className = "w-2 h-20 rounded-full absolute z-20 transition-all duration-75 ease-linear shadow-lg";
  noteDisplay.className = "text-9xl font-black mb-2 transition-colors duration-200";

  // Margem de 3 cents para considerar perfeito
  if (Math.abs(cents) <= 3) {
    // Efeito brilhante verde (Afinado)
    pointer.classList.add('bg-green-400', 'shadow-[0_0_20px_#4ade80]');
    noteDisplay.classList.add('text-green-400', 'drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]');
    instructionText.textContent = "Perfeito!";
    instructionText.className = "text-xl font-bold uppercase tracking-widest text-green-400 mb-12 drop-shadow-md";
  } else {
    // Fora do tom (Laranja/Vermelho dependendo da distância)
    if (Math.abs(cents) > 20) {
      pointer.classList.add('bg-red-500');
    } else {
      pointer.classList.add('bg-yellow-400');
    }
    
    noteDisplay.classList.add('text-gray-200');
    instructionText.className = "text-xl font-bold uppercase tracking-widest text-gray-500 mb-12";
    instructionText.textContent = cents < 0 ? "Aperte a corda" : "Solte a corda";
  }
}
