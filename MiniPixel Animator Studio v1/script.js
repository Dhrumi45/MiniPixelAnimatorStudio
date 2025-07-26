const grid = document.getElementById('grid'); // Get the pixel grid container element
const palette = document.getElementById('palette'); // Get the color palette container element
const framesList = document.getElementById('framesList'); // Get the container for animation frame thumbnails

let selectedColor = '#000000'; // Currently selected color, default black
let currentFrame = []; // Array to store colors of pixels in the current frame
let frames = []; // Array of frames, each frame is an array of pixel colors
let isPlaying = false; // Flag to check if animation is playing
let playInterval = null; // Reference to the interval timer for animation playback
let hiddenFrameExists = true; // Flag to check if the hidden frame (used internally) exists
let visibleFrameIndex = 0; // Index of the currently visible/active frame in the editor
let animationFramesIndices = [0, 1]; // Indices of frames included in the animation playback (starts with two frames)

// Initialize grid pixels (16x16 = 256 pixels)
for (let i = 0; i < 256; i++) {
  const pixel = document.createElement('div'); // Create a new div for a pixel
  pixel.className = 'pixel'; // Add class for styling
  pixel.dataset.index = i; // Store pixel index in dataset for reference
  pixel.style.backgroundColor = '#ffffff'; // Set default pixel color to white
  pixel.addEventListener('click', () => { // Add click event to paint pixel
    if (isPlaying) return; // Disable editing while animation is playing
    pixel.style.backgroundColor = selectedColor; // Change pixel color to selected color
    currentFrame[i] = selectedColor; // Update color in current frame data
    frames[visibleFrameIndex][i] = selectedColor; // Update color in the frames array for current frame
    updateThumbnail(visibleFrameIndex); // Update the thumbnail preview of the current frame
  });
  grid.appendChild(pixel); // Add pixel to the grid container
  currentFrame.push('#ffffff'); // Initialize current frame pixel color to white
}

// Initial default colors for the palette
const defaultColors = ['#000000', '#ffffff', '#e9760a', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#888888'];
const customColorsStartIndex = defaultColors.length; // Keep track of where custom colors start in the palette
defaultColors.forEach(addColorSwatch); // Add each default color as a swatch in the palette

// Create a color swatch element for a given color
function createColorSwatch(color) {
  const swatch = document.createElement('div'); // Create div for swatch
  swatch.className = 'color-swatch'; // Assign styling class
  swatch.style.backgroundColor = color; // Set swatch background to the color
  swatch.addEventListener('click', () => { // On click, select this color
    selectedColor = color; // Update selected color
    // Remove 'selected' class from all swatches
    document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
    swatch.classList.add('selected'); // Add 'selected' class to clicked swatch
  });
  return swatch; // Return the created swatch element
}

// Add a color swatch to the palette container
function addColorSwatch(color) {
  const swatch = createColorSwatch(color); // Create swatch element
  palette.appendChild(swatch); // Append swatch to palette
}

palette.firstChild.classList.add('selected'); // Mark the first swatch (black) as selected by default

// Trigger hidden color input to open color picker dialog
function triggerColorPicker() {
  document.getElementById('customColorInput').click();
}

// Add a custom color selected from color picker to the palette
function addCustomColor(hexColor) {
  const rgb = hexToRgb(hexColor); // Convert hex to rgb format to compare colors correctly
  // Check if color already exists in palette
  const alreadyExists = Array.from(palette.children).some(
    swatch => swatch.style.backgroundColor === rgb
  );
  if (alreadyExists) return; // Prevent duplicate colors

  const swatch = createColorSwatch(hexColor); // Create swatch for new color

  // Insert new custom color below default colors (after index customColorsStartIndex)
  let insertBeforeNode = null;
  if (palette.children.length > customColorsStartIndex) {
    insertBeforeNode = palette.children[customColorsStartIndex]; // First custom color swatch to insert before
  }

  palette.insertBefore(swatch, insertBeforeNode); // Insert the new swatch

  // Auto-select the new custom color
  selectedColor = hexColor;
  document.querySelectorAll('.color-swatch').forEach(el => el.classList.remove('selected'));
  swatch.classList.add('selected');
}

// Convert hex color string to RGB string (used to compare colors correctly)
function hexToRgb(hex) {
  hex = hex.replace(/^#/, ''); // Remove leading #
  if (hex.length === 3) {
    // Expand shorthand (#abc to #aabbcc)
    hex = hex.split('').map(c => c + c).join('');
  }
  const bigint = parseInt(hex, 16); // Parse hex to integer
  const r = (bigint >> 16) & 255; // Extract red component
  const g = (bigint >> 8) & 255; // Extract green component
  const b = bigint & 255; // Extract blue component
  return `rgb(${r}, ${g}, ${b})`; // Return RGB string format
}

// Initialize frames data structure and UI elements
function initFrames() {
  frames = []; // Clear frames array
  animationFramesIndices = [0, 1]; // Reset animation frame indices
  hiddenFrameExists = true; // Set hidden frame flag true
  visibleFrameIndex = 0; // Set first frame visible

  const frame0 = Array(256).fill('#ffffff'); // Create initial frame with all white pixels
  const hiddenFrame = Array(256).fill('#ffffff'); // Create hidden frame for internal use

  frames.push(frame0); // Add first frame
  frames.push(hiddenFrame); // Add hidden frame

  framesList.innerHTML = ''; // Clear existing thumbnails
  addThumbnail(0); // Add thumbnail for first frame
  loadFrameToGrid(0); // Load first frame into grid for editing
}

initFrames(); // Run initialization on page load

// Load a frame's pixel colors into the grid UI
function loadFrameToGrid(frameIndex) {
  currentFrame = [...frames[frameIndex]]; // Copy frame data into currentFrame
  // Set each pixel div's background color based on current frame
  document.querySelectorAll('.pixel').forEach((pixel, idx) => {
    pixel.style.backgroundColor = currentFrame[idx];
  });
  highlightThumbnail(frameIndex); // Highlight the thumbnail of the loaded frame
}

// Create and add a thumbnail canvas representing a frame
function addThumbnail(frameIndex) {
  const thumb = document.createElement('canvas'); // Create canvas element for thumbnail
  thumb.className = 'frame-thumb'; // Assign CSS class
  thumb.width = 64; // Set width (16 pixels * 4)
  thumb.height = 64; // Set height (16 pixels * 4)
  thumb.dataset.index = frameIndex; // Store frame index

  const ctx = thumb.getContext('2d'); // Get 2D context for drawing
  ctx.imageSmoothingEnabled = false; // Disable smoothing for pixelated look

  // Draw each pixel of frame onto canvas scaled 4x4 pixels
  for (let i = 0; i < 256; i++) {
    const x = i % 16; // x coordinate in grid
    const y = Math.floor(i / 16); // y coordinate in grid
    ctx.fillStyle = frames[frameIndex][i]; // Set fill to pixel color
    ctx.fillRect(x * 4, y * 4, 4, 4); // Draw rectangle for pixel
  }

  // Clicking the thumbnail loads the corresponding frame into the grid
  thumb.addEventListener('click', () => {
    visibleFrameIndex = frameIndex;
    loadFrameToGrid(frameIndex);
  });

  framesList.appendChild(thumb); // Add thumbnail canvas to frames list container
}

// Update the thumbnail canvas when the frame's pixels change
function updateThumbnail(frameIndex) {
  const thumbs = framesList.querySelectorAll('.frame-thumb'); // Get all thumbnails
  thumbs.forEach(thumb => {
    if (parseInt(thumb.dataset.index) === frameIndex) { // Find thumbnail of target frame
      const ctx = thumb.getContext('2d');
      ctx.clearRect(0, 0, 64, 64); // Clear old drawing
      for (let i = 0; i < 256; i++) {
        const x = i % 16;
        const y = Math.floor(i / 16);
        ctx.fillStyle = frames[frameIndex][i];
        ctx.fillRect(x * 4, y * 4, 4, 4);
      }
    }
  });
}

// Visually highlight the currently selected frame thumbnail
function highlightThumbnail(frameIndex) {
  framesList.querySelectorAll('.frame-thumb').forEach(thumb => {
    thumb.classList.toggle('selected', parseInt(thumb.dataset.index) === frameIndex);
  });
}

// Add a new frame to the animation
function addFrame() {
  if (hiddenFrameExists) {
    frames.splice(1, 1); // Remove hidden frame
    hiddenFrameExists = false;
    animationFramesIndices = animationFramesIndices.filter(i => i !== 1); // Remove index 1 from animation frames
  }

  const newFrame = Array(256).fill('#ffffff'); // Create new blank frame
  frames.push(newFrame); // Add it to frames array
  const newIndex = frames.length - 1; // New frame index
  animationFramesIndices.push(newIndex); // Add new frame index to animation sequence

  framesList.innerHTML = ''; // Clear thumbnails
  animationFramesIndices.forEach(i => addThumbnail(i)); // Add thumbnails for all frames in animation

  visibleFrameIndex = newIndex; // Make new frame the visible frame
  loadFrameToGrid(newIndex); // Load new frame into grid for editing
}

// Delete a frame from animation
function deleteFrame() {
  if (frames.length <= 1) {
    alert('Cannot delete the only remaining frame!'); // Prevent deleting last frame
    return;
  }

  const frameNum = prompt(`Enter frame number to delete (1 to ${frames.length}):`); // Prompt user for frame number
  const frameIndex = parseInt(frameNum, 10) - 1; // Convert to zero-based index

  if (isNaN(frameIndex) || frameIndex < 0 || frameIndex >= frames.length) {
    alert('Invalid frame number'); // Validate input
    return;
  }

  frames.splice(frameIndex, 1); // Remove the frame from array
  animationFramesIndices = animationFramesIndices.filter(i => i !== frameIndex); // Remove from animation sequence
  animationFramesIndices = animationFramesIndices.map(i => (i > frameIndex ? i - 1 : i)); // Adjust indices after removal

  // Adjust visible frame index if needed
  if (visibleFrameIndex === frameIndex) {
    visibleFrameIndex = 0;
  } else if (visibleFrameIndex > frameIndex) {
    visibleFrameIndex--;
  }

  // If only one frame left and hidden frame does not exist, add hidden frame back
  if (animationFramesIndices.length === 1 && !hiddenFrameExists) {
    const hiddenFrame = Array(256).fill('#ffffff');
    frames.splice(1, 0, hiddenFrame);
    animationFramesIndices.push(1);
    hiddenFrameExists = true;
    animationFramesIndices = animationFramesIndices.sort((a, b) => a - b);
  }

  framesList.innerHTML = ''; // Clear thumbnails
  animationFramesIndices.forEach(i => {
    // Do not add thumbnail for hidden frame when it exists
    if (!(hiddenFrameExists && i === 1)) {
      addThumbnail(i);
    }
  });

  loadFrameToGrid(visibleFrameIndex); // Load current visible frame into grid
}

// Play the animation by cycling through frames and pixels
function playAnimation() {
  if (isPlaying) return; // Prevent multiple play calls
  isPlaying = true; // Mark animation as playing

  const durationInput = document.getElementById('frameDuration'); // Get frame duration input
  let duration = parseInt(durationInput.value, 10); // Parse duration value
  if (isNaN(duration) || duration < 100) duration = 500; // Default duration if invalid or too low

  let frameIdxInArray = 0; // Index of current frame in animationFramesIndices
  let pixelIndex = 0; // Index of current pixel in frame

  clearInterval(playInterval); // Clear any existing interval to avoid duplicates

  // Function to fill one pixel at a time for animation effect
  function fillNextPixel() {
    if (!isPlaying) return; // Stop if animation is stopped

    const frameIndex = animationFramesIndices[frameIdxInArray]; // Get current frame index
    const frame = frames[frameIndex]; // Get pixel data for current frame

    grid.children[pixelIndex].style.backgroundColor = frame[pixelIndex]; // Update pixel color in grid
    pixelIndex++; // Move to next pixel

    // If reached end of pixels in frame, move to next frame after delay
    if (pixelIndex >= frame.length) {
      pixelIndex = 0; // Reset pixel index
      frameIdxInArray = (frameIdxInArray + 1) % animationFramesIndices.length; // Move to next frame cyclically
      clearInterval(playInterval); // Pause pixel filling interval
      setTimeout(() => {
        if (isPlaying) {
          // Resume pixel filling after frame duration delay
          playInterval = setInterval(fillNextPixel, duration / 256);
        }
      }, duration);
    }
  }

  // Start interval to fill pixels at speed depending on duration per frame
  playInterval = setInterval(fillNextPixel, duration / 256);
}

// Stop the animation playback
function stopAnimation() {
  if (playInterval) clearInterval(playInterval); // Clear interval timer
  isPlaying = false; // Mark animation as stopped
}

// Expose main functions to global scope for HTML onclick handlers
window.addFrame = addFrame;
window.playAnimation = playAnimation;
window.stopAnimation = stopAnimation;
window.deleteFrame = deleteFrame;
window.triggerColorPicker = triggerColorPicker;
window.addCustomColor = addCustomColor;
