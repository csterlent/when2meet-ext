// ==UserScript==
// @name     when2meet
// @description use your keyboard to declare your availability
// @version  1
// @grant none
// @match    https://www.when2meet.com/*
// ==/UserScript==

/*
CONTROLS:
	hjkl:   move left down up right, "motion" can do this multiple times
  $:      go to end of column
  0:      go to beginning of column
  0-9:    "type into" an internal variable called "motion" that holds a number and modifies other commands
  v:      begin selection
  Escape: cancel selection
  Enter:  commit selection. if user is not selecting, it will toggle the current cell, or multiple cells based on "motion"
  g:      go to the hour specified by "motion". defaults to AM but supports military time (eg 22 -> 10:00 PM)
  q:      same as g, but adds a quarter hour
  w:      same as g, but adds a half hour
  e:      same as g, but adds three quarter hours
  G:      go to the column specified by "motion" or just the first column
*/

console.log('script active');

// GreaseMonkey uses unsafeWindow to access globals but TamperMonkey does not.
// This code does nothing on GM but will make a new variable called unsafeWindow on TM
try {
    window.unsafeWindow = window;
}
catch {}

// the cursor
var selectedRow = 0;
var selectedCol = 0;

// the current mode
var visual = false;

// the number typed
var motion = 0;

var originRow, originCol; // if in visual mode, the cell that visual mode was started over

function getCursor() {
  var row = document.getElementById('YouGridSlots').children[selectedRow];
  return row.children[selectedCol];
}

// make when2meet think the user dragged their mouse to the cursor
function to() {
  let evt = new MouseEvent('click');
  getCursor().dispatchEvent(evt);
  unsafeWindow.SelectToHere(evt);
}

// make when2meet think the user started a new selection
function from() {
  let evt = new MouseEvent('click');
  getCursor().dispatchEvent(evt);
  unsafeWindow.SelectFromHere(evt);
}

function handleUserInput(evt) {
  var rows = document.getElementById('YouGridSlots').childElementCount;
  var cols = document.getElementById('YouGridSlots').children[0].childElementCount;

  var key = evt.key;

  switch(evt.key) {
    case 'h':
      for (let i = 0; i < Math.max(motion, 1); i++) {
        selectedCol = (selectedCol - 1 + cols) % cols;
      }
      break;

    case 'j':
      for (let i = 0; i < Math.max(motion, 1); i++) {
        selectedRow = (selectedRow + 1) % rows;
      }
      break;

    case 'k':
      for (let i = 0; i < Math.max(motion, 1); i++) {
        selectedRow = (selectedRow - 1 + rows) % rows;
      }
      break;

    case 'l':
      for (let i = 0; i < Math.max(motion, 1); i++) {
        selectedCol = (selectedCol + 1) % cols;
      }
      break;

    case '$':
      selectedRow = rows - 1;
      break;

    case '0':
      if (motion == 0) {
        selectedRow = 0;
      }
      else {
        motion = Number(motion + '0');
      }
      break;

    case '1': case '2': case '3':case '4': case '5': case '6': case '7': case '8': case '9':
      motion = Number(motion + evt.key);
      break;

    case 'Enter':
      if (!visual) {
        from();
        selectedRow += Math.max(motion - 1, 0);
        to();
        selectedRow -= Math.max(motion - 1, 0);
      }
      unsafeWindow.SelectStop();
      visual = false;
      break;

    case 'v':
      visual = true;
      originRow = selectedRow;
      originCol = selectedCol;
      from();
      break;

    case 'Escape':
      if (visual) {
        let _row = selectedRow;
        let _col = selectedCol;
        selectedRow = originRow;
        selectedCol = originCol;
        to();
        unsafeWindow.SelectStop();
        from();
        to();
        unsafeWindow.SelectStop(); // we just toggled the origin cell, so we should untoggle it
        selectedRow = _row;
        selectedCol = _col;
      }
      visual = false;
      break;

    case 'g': case 'q': case 'w': case 'e':
      var primary, secondary;
      if (motion < 12) {
        primary = motion + ':00  AM';
      }
      else {
        primary = motion - 12 + ':00  PM';
      }
      secondary = motion + ':00  PM';

      var index = -1;
      var parent = document.getElementById('YouGrid').children[2];
      for (let i in parent.children) {
        let text = parent.children[i].textContent;
        if (!text) {
          continue;
        }
        if (text.startsWith(primary)) {
          index = i;
        }
        else if (text.startsWith(secondary) && index == -1) {
          index = i;
        }
      }
      selectedRow = index - 3 + ['g', 'q', 'w', 'e'].indexOf(evt.key);
      if (selectedRow >= rows) {
          selectedRow = rows - 1;
      }
      break;

    case 'G':
      if (motion <= cols) {
        selectedCol = Math.max(motion - 1, 0);
      }
      break;

    default:
      return;
  }

  if (visual) {
  	to();
  }
  else {		// recolor so the previous cursor location is not still highlighted
    unsafeWindow.ReColorIndividual();
  }

  if (evt.key < '0' || evt.key > '9') {
    motion = 0;
  }

  highlightCursor();
}

function highlightCursor() {
  getCursor().style.background = "rgb(255, 255, 0) none repeat scroll 0% 0%";
}

function highlightLoop() {
  highlightCursor();
  setTimeout(highlightLoop);
}
//highlightLoop();

window.addEventListener('keydown', handleUserInput);
