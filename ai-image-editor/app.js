const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadContent = document.getElementById('uploadContent');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const changeImageBtn = document.getElementById('changeImageBtn');
const uploadBtn = document.getElementById('uploadBtn');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const toast = document.getElementById('toast');

const chipGroups = document.querySelectorAll('.chip-group');
const resultCards = {
  promli: document.getElementById('resultPromli'),
  zimage: document.getElementById('resultZimage'),
  easemate: document.getElementById('resultEasemate')
};
const resultLinks = document.querySelectorAll('.result-link');

let currentFile = null;

const TOOLS = {
  promli: {
    name: 'Promli',
    url: 'https://promli.com/tr/app/pictures/create/image-editor',
    card: resultCards.promli
  },
  zimage: {
    name: 'Z-Image-Edit',
    url: 'https://zimageturbo.ai/tr/z-image-edit',
    card: resultCards.zimage
  },
  easemate: {
    name: 'EaseMate AI',
    url: 'https://www.easemate.ai/tr/gpt-image-1-5-image-generator',
    card: resultCards.easemate
  }
};

const CLOTHING_MAP = {
  'gündelik': 'casual wear, t-shirt and jeans, everyday outfit',
  'spor': 'sportswear, athletic wear, sporty outfit',
  'parti': 'party dress, glamorous party outfit',
  'plaj': 'beachwear, bikini, swimwear',
  'kısa etek': 'short skirt, mini skirt outfit',
  'straplez': 'strapless dress, strapless top',
  'düşük kalp yaka': 'low sweetheart neckline, deep neckline',
  'derin yırtmaç': 'deep slit dress, high slit outfit',
  'dekolteli': 'low-cut top, plunging neckline',
  'parti+straplez': 'strapless party dress, glamorous',
  'spor+kısa etek': 'sporty outfit with short skirt',
  'plaj+dekolteli': 'beachwear with plunging neckline',
  'gündelik+düşük kalp yaka': 'casual wear with sweetheart neckline',
  'parti+derin yırtmaç': 'party dress with deep slit'
};

const BG_MAP = {
  'dış mekan gündüz': 'outdoor daytime, natural sunlight, bright day',
  'dış mekan gece': 'outdoor nighttime, city lights, night scenery',
  'plaj gündüz': 'beach daytime, ocean view, sunny beach',
  'şehir gece': 'city nightscape, urban night, neon lights',
  'park gündüz': 'park daytime, green grass, trees, nature',
  'sokak gece': 'street at night, street lamps, night ambiance',
  'dağ gündüz': 'mountain landscape, scenic view, daylight',
  'havuz kenarı': 'poolside, swimming pool, resort'
};

const BODY_MAP = {
  'full body': 'full body view, from head to toe',
  'yarı boy': 'half body shot, from waist up',
  'portre': 'close-up portrait, head and shoulders',
  'yandan': 'side profile pose, looking to the side',
  'oturur': 'sitting pose, seated position',
  'ayakta': 'standing pose, upright position',
  'yürür': 'walking pose, in motion'
};

let selected = {
  clothing: 'gündelik',
  background: 'dış mekan gündüz',
  body: 'full body'
};

// ====== Chips ======
chipGroups.forEach(group => {
  const chips = group.querySelectorAll('.chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const groupName = chip.closest('.option-group').querySelector('label').textContent.trim();
      if (groupName === 'Kıyafet Tipi') {
        chip.classList.toggle('chip-selected');
        const selectedChips = [...group.querySelectorAll('.chip-selected')].map(c => c.dataset.value);
        selected.clothing = selectedChips.length > 0 ? selectedChips.join('+') : 'gündelik';
      } else {
        chips.forEach(c => c.classList.remove('chip-selected'));
        chip.classList.add('chip-selected');
        if (groupName.includes('Ortam')) selected.background = chip.dataset.value;
        if (groupName.includes('Vücut')) selected.body = chip.dataset.value;
      }
    });
  });
});

// Ensure at least one clothing is selected
document.querySelectorAll('#clothingGroup .chip')[0].classList.add('chip-selected');

// ====== Image Upload ======
uploadBtn.addEventListener('click', () => fileInput.click());
changeImageBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('Lütfen JPEG, PNG veya WEBP formatında bir görsel yükleyin.');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast('Dosya boyutu 20MB\'ı geçmemelidir.');
    return;
  }
  currentFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    uploadContent.classList.add('hidden');
    previewArea.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// ====== Prompt Builder ======
function buildPrompt() {
  const clothingKeys = selected.clothing.split('+');
  const clothingParts = clothingKeys.map(k => CLOTHING_MAP[k] || CLOTHING_MAP['gündelik']);
  const clothDesc = clothingParts.join(', ');

  const bgDesc = BG_MAP[selected.background] || BG_MAP['dış mekan gündüz'];
  const bodyDesc = BODY_MAP[selected.body] || BODY_MAP['full body'];

  const ultra = document.getElementById('ultraQuality').checked;
  const extra = document.getElementById('extraDetails').checked;
  const extraPrompt = promptInput.value.trim();

  let quality = '8K ultra high resolution, highly detailed, sharp focus';
  if (ultra) quality = '8K ultra high resolution, 4K, highly detailed, crystal clear, sharp focus';
  if (extra) quality += ', intricate details, texture details, fabric details';

  let prompt = `Model wearing ${clothDesc}. ${bodyDesc}. ${bgDesc}. ${quality}. `;
  prompt += 'Professional photography, well-lit natural lighting, perfect exposure, vibrant but natural colors. ';
  prompt += 'Perfect anatomy, normal hands and fingers, natural face, beautiful natural skin tone, flawless skin texture. ';
  prompt += 'No deformities, no extra limbs, no distorted face, no sagging skin, no unnatural body proportions. ';
  prompt += 'No overly bright or overly dark areas, balanced lighting, clear model visibility in all conditions. ';
  prompt += 'Cinematic quality, fashion photography style, photorealistic.';

  if (extraPrompt) {
    prompt += ` Additional instruction: ${extraPrompt}.`;
  }

  return prompt;
}

// ====== Generate ======
generateBtn.addEventListener('click', () => {
  if (!currentFile) {
    showToast('Lütfen önce bir görsel yükleyin.');
    return;
  }

  const generatedPrompt = buildPrompt();
  const fileDataUrl = previewImage.src;

  generateBtn.disabled = true;
  generateBtn.classList.add('loading');
  generateBtn.innerHTML = '⏳ Üretiliyor...';

  // Start all 3 tools
  Object.entries(TOOLS).forEach(([key, tool], index) => {
    const card = tool.card;
    card.classList.add('generating');
    card.classList.remove('done');

    const placeholder = card.querySelector('.result-placeholder');
    placeholder.innerHTML = '<div class="spinner"></div><span>Yapay zeka üretiyor...</span>';
    placeholder.classList.remove('hidden');
    card.querySelector('.result-img').classList.add('hidden');

    // Open each tool in new tab with delay so they don't get blocked
    setTimeout(() => {
      openToolInNewTab(tool, fileDataUrl, generatedPrompt, key);
    }, index * 400);
  });

  // Reset button after all open
  setTimeout(() => {
    generateBtn.disabled = false;
    generateBtn.classList.remove('loading');
    generateBtn.innerHTML = '✦ Üretimi Başlat';
    showToast('3 araç da yeni sekmede açıldı. Görseli yükleyip promptu yapıştırın.');
  }, 2000);
});

function openToolInNewTab(tool, fileDataUrl, prompt, key) {
  const card = tool.card;

  // Try to open the site with prompt in URL query
  const searchParams = new URLSearchParams({
    prompt: prompt.slice(0, 500)
  });

  // Some sites accept prompt via URL hash or query
  let url = tool.url;
  if (key === 'easemate') {
    url = `${tool.url}?prompt=${encodeURIComponent(prompt.slice(0, 300))}`;
  } else if (key === 'zimage') {
    url = `${tool.url}?q=${encodeURIComponent(prompt.slice(0, 300))}`;
  }
  // Promli doesn't have known URL params

  const newWindow = window.open(url, '_blank');

  if (newWindow) {
    // Try to postMessage the prompt to the site (works if they support it)
    setTimeout(() => {
      try {
        newWindow.postMessage({
          type: 'AI_EDITOR_PROMPT',
          prompt: prompt,
          imageData: fileDataUrl
        }, '*');
      } catch (e) {
        // Cross-origin postMessage may fail silently, that's fine
      }
    }, 2000);
  }

  // After some time, mark as done
  setTimeout(() => {
    card.classList.remove('generating');
    card.classList.add('done');
    const placeholder = card.querySelector('.result-placeholder');
    placeholder.innerHTML = '<span>Yeni sekmede açıldı.<br/>Görseli yükleyip promptu yapıştırın.</span>';
  }, 3000);
}

// ====== Toast ======
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show');
  }, 4000);
}
