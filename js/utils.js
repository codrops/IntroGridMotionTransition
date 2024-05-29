/**
 * Preloads images specified by the CSS selector.
 * @function
 * @param {string} [selector='img'] - CSS selector for target images.
 * @returns {Promise} - Resolves when all specified images are loaded.
 */
export const preloadImages = (selector = 'img') => {
  return new Promise((resolve) => {
      // The imagesLoaded library is used to ensure all images (including backgrounds) are fully loaded.
      imagesLoaded(document.querySelectorAll(selector), {background: true}, resolve);
  });
};

// Linear interpolation
export const lerp = (a, b, n) => (1 - n) * a + n * b;

// Gets the mouse position
export const getMousePos = e => {
  return { 
      x : e.clientX, 
      y : e.clientY 
  };
};