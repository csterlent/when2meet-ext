// ==UserScript==
// @name     when2meet autofiller
// @description press p to automatically fill in your availability
// @version  1
// @grant none
// @match    https://www.when2meet.com/*
// ==/UserScript==

console.log('script active');

// GreaseMonkey uses unsafeWindow to access globals but TamperMonkey does not.
// This code does nothing on GM but will make a new variable called unsafeWindow on TM
try {
    window.unsafeWindow = window;
}
catch {}

// Get the HTML element corresponding to row and column coordinates
function getCursor(row, col) {
  var row = document.getElementById('YouGridSlots').children[row];
  return row.children[col];
}

// make when2meet think the user dragged their mouse to the cursor
function to(row, col) {
  let evt = new MouseEvent('click');
  getCursor(row, col).dispatchEvent(evt);
  unsafeWindow.SelectToHere(evt);
}

// make when2meet think the user started a new selection
function from(row, col) {
  let evt = new MouseEvent('click');
  getCursor(row, col).dispatchEvent(evt);
  unsafeWindow.SelectFromHere(evt);
}

// Select the 4 slots corresponding to an hour. time may be '10:00  AM' and col may be 0
// In other words, select the 4 slots starting at 10:00 on Sunday
function selectSlots (time, col) {
  // Find the index of the row where the new selection should end
  var index;
  var located = false;
  var parent = document.getElementById('YouGrid').children[2];
  for (let i = 0; i < parent.children.length - 1; i++) {
    let text = parent.children[i].textContent;
    if (!text) {
      continue;
    }
    if (text.startsWith(time)) {
      index = i;
      located = true;
      break;
    }
  }
  
  // Fail to find time in slots, so don't do anything
  if (!located) {
    console.log('Failed to find time ' + time)
    return
  }
  if (time == '5:00  PM') console.log('it is 5');
  
  // Make the selection
  from(index - 3, col);
  to(index, col);
  unsafeWindow.SelectStop();
}

// With one row per day, ie timeTable[0] refers to Sunday
const timeTable = [
  ['10:00  AM', '11:00  AM', '12:00  PM', '1:00  PM', '2:00  PM', '3:00  PM', '4:00  PM', '5:00  PM', '6:00  PM', '7:00  PM', '8:00  PM', '9:00  PM', '10:00  PM'],
  ['1:00  PM', '2:00  PM', '3:00  PM', '4:00  PM', '5:00  PM', '6:00  PM', '7:00  PM', '8:00  PM', '9:00  PM', '10:00  PM'],
  ['6:00  PM', '7:00  PM', '8:00  PM', '9:00  PM', '10:00  PM'],
  ['10:00  AM', '11:00  AM', '12:00  PM', '1:00  PM', '2:00  PM', '3:00  PM', '4:00  PM', '5:00  PM', '6:00  PM', '7:00  PM', '8:00  PM', '9:00  PM', '10:00  PM'],
  [],
  ['10:00  AM', '11:00  AM', '12:00  PM', '1:00  PM', '2:00  PM', '3:00  PM', '4:00  PM', '5:00  PM', '6:00  PM', '7:00  PM', '8:00  PM', '9:00  PM', '10:00  PM'],
  ['10:00  AM', '11:00  AM', '12:00  PM', '1:00  PM', '2:00  PM', '3:00  PM', '4:00  PM', '5:00  PM', '6:00  PM', '7:00  PM', '8:00  PM', '9:00  PM', '10:00  PM'],
  ]

// Event listener that can edit when2meet when the user types 'p'
function edit(e) {
  if (e.key != 'p') return;
  for (let i in timeTable) {
    for (let j in timeTable[i]) {
      selectSlots(timeTable[i][j], i)
    }
  }
}
window.addEventListener('keydown', edit);
