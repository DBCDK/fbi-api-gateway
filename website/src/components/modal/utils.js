// elements we want
const elements = [
  "a",
  "input:not([type='hidden'])",
  "button",
  "textarea",
  "[tabindex]",
];

// currently not in use
export function tabVisibility(container, isVisible) {
  // build query with elements
  const query = elements.join(", ");

  // Find mathing elements according to elements and select string
  const matchedElements = Object.values(container.querySelectorAll(query));

  matchedElements.forEach((el) => {
    const tabIndex = el.getAttribute("tabindex") || false;
    const savedTabIndex = el.getAttribute("data-tabindex") || false;

    el.setAttribute(
      "tabindex",
      isVisible ? savedTabIndex || tabIndex || "0" : "-1"
    );

    if (!savedTabIndex) {
      el.setAttribute("data-tabindex", tabIndex);
    }
  });
}

/**
 * Function to trap Tab inside modal
 *
 * @param {obj} event current target element (focused element)
 * @param {obj} container container to trap Tab in (modal)
 *
 * https://medium.com/@islam.sayed8/trap-focus-inside-a-modal-aa5230326c1b
 * https://medium.com/@seif_ghezala/how-to-create-an-accessible-react-modal-5b87e6a27503
 */

export function handleTab(event, container) {
  event.preventDefault();

  const el = container.querySelector("div.modal_page.page-current");

  // Custom select string to tail after each element in list
  // Dont select elements with display:none inline style
  // Dont select hidden elements
  // Dont select elements with tabindex -1
  const select =
    ":not([aria-hidden='true']):not([tabindex='-1']):not([style*='display:none']):not([style*='display: none']):not([disabled])";

  // build query with elements
  const query = elements.join(select + ", ") + select;

  // Find mathing elements according to elements and select string
  const matchedElements = Object.values(el.querySelectorAll(query));

  // Remove elements which parent is not visible
  const visibleChildren = matchedElements.filter(
    (el) => el.offsetParent !== null
  );

  // Remove all elements which is display:none in computedStyles (css stylesheet)
  // OBS! Performance Warning! getComputedStyle func can be slow
  const sequence = visibleChildren.filter(
    (el) => getComputedStyle(el).display !== "none"
  );

  // Debug -> remove me in future
  console.log("Debug", { sequence });

  if (sequence.length < 1) {
    return;
  }

  const backward = event.shiftKey;
  const first = sequence[0];
  const last = sequence[sequence.length - 1];

  // wrap around first to last, last to first
  const source = backward ? first : last;
  const target = backward ? last : first;

  if (source === event.target) {
    target.focus();
    return;
  }

  // find current position in tabsequence
  let currentIndex;
  const found = sequence.some(function (element, index) {
    if (element !== event.target) {
      return false;
    }

    currentIndex = index;
    return true;
  });

  if (!found) {
    // redirect to first as we're not in our tabsequence
    first.focus();
    return;
  }

  // shift focus to previous/next element in the sequence
  const offset = backward ? -1 : 1;
  sequence[currentIndex + offset].focus();
}

/**
 * Function to get random color by random string
 *
 *  @param {string} id
 *  @param {array} colors
 */
export function toColor(
  id,
  colors = ["#ffe7e0", "#e5c7bd", "#f4efdd", "#eed9b0", "#b7dee2"]
) {
  let hash = 0;
  if (id.length === 0) {
    return hash;
  }
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  hash = ((hash % colors.length) + colors.length) % colors.length;
  return colors[hash];
}

/**
 * Function to get scrollY (scroll distance from top)
 *
 * @returns {int}
 */
function getScrollYPos() {
  // Get scrollY (all browsers)
  var doc = document.documentElement;
  var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
  return top;
}

/**
 * Function to handle scrollLock on body
 *
 * @param {bool} shouldLockScroll
 *
 */
let scrollY = 0;
export function scrollLock(shouldLockScroll) {
  const body = document.body;
  const layout = document.getElementById("layout");

  // We need booth
  if (!body || !layout) {
    return;
  }

  const isLocked = body.classList.contains("lockScroll");

  // Add "lock" class and add "fake" scrollY position to body
  if (shouldLockScroll && !isLocked) {
    scrollY = getScrollYPos();
    layout.style.marginTop = `-${scrollY}px`;
    body.classList.add("lockScroll");
  }
  // Remove "lock", remove "fake" scrollY position
  // + Scroll back to the scrollY position - same as before the modal was triggered
  else if (!shouldLockScroll && isLocked) {
    body.classList.remove("lockScroll");
    layout.style.marginTop = `auto`;
    window.scrollTo(0, scrollY);
  }
}
