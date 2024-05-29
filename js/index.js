// Importing utility functions for preloading images, getting mouse position, and linear interpolation
import { preloadImages, getMousePos, lerp } from './utils.js';

// Registers the Flip plugin with GSAP
gsap.registerPlugin(Flip);

const body = document.body; // Reference to the body element
const frame = document.querySelector('.frame'); // Reference to the frame element
const content = document.querySelector('.content'); // Reference to the content element
const enterButton = document.querySelector('.enter'); // Reference to the "Explore" button
const fullview = document.querySelector('.fullview'); // Reference to the fullview element
const grid = document.querySelector('.grid'); // Reference to the grid element
const gridRows = grid.querySelectorAll('.row'); // Reference to all row elements within the grid

// Cache window size and update on resize
let winsize = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener('resize', () => {
  winsize = { width: window.innerWidth, height: window.innerHeight };
});

// Initialize mouse position object
let mousepos = { x: winsize.width / 2, y: winsize.height / 2 };

// Configuration for enabling/disabling animations
const config = {
  translateX: true,
  skewX: false,
  contrast: true,
  scale: false,
  brightness: true
};

// Total number of rows
const numRows = gridRows.length;
// Calculate the middle row assuming an odd number of rows
const middleRowIndex = Math.floor(numRows / 2);

const middleRow = gridRows[middleRowIndex]; // Reference to the middle row
const middleRowItems = middleRow.querySelectorAll('.row__item'); // Reference to all items within the middle row
const numRowItems = middleRowItems.length; // Number of items in the middle row
const middleRowItemIndex = Math.floor(numRowItems / 2); // Index of the middle item in the middle row
// Select the .row__item-inner element inside the middle .row__item element of the middle row
// This element will be used for the animation that transitions the image to fullscreen when the button is clicked
const middleRowItemInner = middleRowItems[middleRowItemIndex].querySelector('.row__item-inner');
// And the inner image
const middleRowItemInnerImage = middleRowItemInner.querySelector('.row__item-img');
// Setting the final size of the middle image for the reveal effect
middleRowItemInnerImage.classList.add('row__item-img--large');

// amt represents the interpolation amount for each row's movement.
// A higher amt value means faster interpolation and less lag behind the mouse movement.
const baseAmt = 0.1; // The amt for the middle row, which will have the fastest response.
const minAmt = 0.05; // Minimum amt value to ensure rows have a noticeable movement lag.
const maxAmt = 0.1; // Maximum amt value to ensure rows have a noticeable movement lag.

// Initialize rendered styles for each row with dynamically calculated amt values
let renderedStyles = Array.from({ length: numRows }, (v, index) => {
  const distanceFromMiddle = Math.abs(index - middleRowIndex);
  // Calculate amt dynamically based on the distance from the middle row
  const amt = Math.max(baseAmt - distanceFromMiddle * 0.03, minAmt);
  // Inverted amt for scale: outermost rows are faster
  const scaleAmt = Math.min(baseAmt + distanceFromMiddle * 0.03, maxAmt);
  let style = { amt, scaleAmt };
  
  if (config.translateX) {
    style.translateX = { previous: 0, current: 0 };
  }
  if (config.skewX) {
    style.skewX = { previous: 0, current: 0 };
  }
  if (config.contrast) {
    style.contrast = { previous: 100, current: 100 };
  }
  if (config.scale) {
    style.scale = { previous: 1, current: 1 };
  }
  if (config.brightness) {
    style.brightness = { previous: 100, current: 100 };
  }

  return style;
});

// Tracks if the render loop is running
let requestId;

// Update mouse position
const updateMousePosition = (ev) => {
  const pos = getMousePos(ev);
  mousepos.x = pos.x;
  mousepos.y = pos.y;
};

// Map mouse position to translation range
const calculateMappedX = () => {
  return ((mousepos.x / winsize.width) * 2 - 1) * 40 * winsize.width / 100;
};

// Map mouse position to skew range (-3 to 3)
const calculateMappedSkew = () => {
  return ((mousepos.x / winsize.width) * 2 - 1) * 3;
};

// Map mouse position to contrast range (100 at center to 125 at edges)
const calculateMappedContrast = () => {
  const centerContrast = 100;
  const edgeContrast = 330;
  const t = Math.abs((mousepos.x / winsize.width) * 2 - 1);
  const factor = Math.pow(t, 2); // Quadratic factor for non-linear mapping
  return centerContrast - factor * (centerContrast - edgeContrast);
};

// Map mouse position to scale range (1 at center to 0.95 at edges)
const calculateMappedScale = () => {
  const centerScale = 1;
  const edgeScale = 0.95;
  return centerScale - Math.abs((mousepos.x / winsize.width) * 2 - 1) * (centerScale - edgeScale);
};

// Map mouse position to brightness range (100 at center to 15 at edges)
const calculateMappedBrightness = () => {
  const centerBrightness = 100;
  const edgeBrightness = 15;
  const t = Math.abs((mousepos.x / winsize.width) * 2 - 1);
  const factor = Math.pow(t, 2); // Quadratic factor for non-linear mapping
  return centerBrightness - factor * (centerBrightness - edgeBrightness);
};

// Function to get the value of a CSS variable
const getCSSVariableValue = (element, variableName) => {
  return getComputedStyle(element).getPropertyValue(variableName).trim();
};

// Render the current frame
const render = () => {
  const mappedValues = {
    translateX: calculateMappedX(),
    skewX: calculateMappedSkew(),
    contrast: calculateMappedContrast(),
    scale: calculateMappedScale(),
    brightness: calculateMappedBrightness()
  };

  // Calculate and set the translation for each row
  gridRows.forEach((row, index) => {
    const style = renderedStyles[index];

    // Update current positions and interpolate values
    for (let prop in config) {
      if (config[prop]) {
        style[prop].current = mappedValues[prop];
        const amt = prop === 'scale' ? style.scaleAmt : style.amt;
        style[prop].previous = lerp(style[prop].previous, style[prop].current, amt);
      }
    }

    // Apply the interpolated values
    let gsapSettings = {};
    if (config.translateX) gsapSettings.x = style.translateX.previous;
    if (config.skewX) gsapSettings.skewX = style.skewX.previous;
    if (config.scale) gsapSettings.scale = style.scale.previous;
    if (config.contrast) gsapSettings.filter = `contrast(${style.contrast.previous}%)`;
    if (config.brightness) gsapSettings.filter = `${gsapSettings.filter ? gsapSettings.filter + ' ' : ''}brightness(${style.brightness.previous}%)`;

    gsap.set(row, gsapSettings);
  });

  // Continue the render loop
  requestId = requestAnimationFrame(render);
};

// Start the render loop
const startRendering = () => {
  if (!requestId) {
    render();
  }
};

// Stop the render loop
const stopRendering = () => {
  if (requestId) {
    cancelAnimationFrame(requestId);
    requestId = undefined;
  }
};

const enterFullview = () => {
  // Logic to animate the middle image to full view using gsap Flip
  const flipstate = Flip.getState(middleRowItemInner);
  fullview.appendChild(middleRowItemInner);
  
  // Get the CSS variable value for the translation
  const transContent = getCSSVariableValue(content, '--trans-content');

  // Create a GSAP timeline for the Flip animation
  const tl = gsap.timeline();

  // Add the Flip animation to the timeline
  tl.add(Flip.from(flipstate, {
    duration: 0.9,
    ease: 'power4',
    absolute: true,
    onComplete: stopRendering
  }))
  // Fade out grid
  .to(grid, {
    duration: 0.9,
    ease: 'power4',
    opacity: 0.01
  }, 0)
  // Scale up the inner image
  .to(middleRowItemInnerImage, {
    scale: 1.2,
    duration: 3,
    ease: 'sine'
  }, '<-=0.45')
  // Move the content up
  .to(content, {
    y: transContent, // Use the CSS variable value
    duration: 0.9,
    ease: 'power4'
  })
  // Show the frame 
  .add(() => frame.classList.remove('hidden'), '<')
  // Scale and move 
  .to(middleRowItemInnerImage, {
    scale: 1.1,
    startAt: {filter: 'brightness(100%)'},
    filter: 'brightness(50%)',
    y: '-5vh',
    duration: 0.9,
    ease: 'power4'
  }, '<');
  
  // Hide the button
  enterButton.classList.add('hidden');
  // Scrolling allowed
  body.classList.remove('noscroll');
};

// Initialization function
const init = () => {
  startRendering();

  // Initialize click event for the "Explore" button
  enterButton.addEventListener('click', enterFullview);
  // Add touchstart event for mobile devices
  enterButton.addEventListener('touchstart', enterFullview);
};

// Preloading images and initializing setup when complete
preloadImages('.row__item-img').then(() => {
  document.body.classList.remove('loading');
  init();
});

// Mouse movement event listener to update mouse position
window.addEventListener('mousemove', updateMousePosition);
// Touch move event listener for touch devices
window.addEventListener('touchmove', (ev) => {
  const touch = ev.touches[0];
  updateMousePosition(touch);
});
