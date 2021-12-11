"use strict";

// could pass in an array of specific stylesheets for optimization
function getAllCSSVariableNames() {
  var styleSheets = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.styleSheets;
  var cssVars = []; // loop each stylesheet

  for (var i = 0; i < styleSheets.length; i++) {
    // loop stylesheet's cssRules
    try {
      // try/catch used because 'hasOwnProperty' doesn't work
      for (var j = 0; j < styleSheets[i].cssRules.length; j++) {
        try {
          // loop stylesheet's cssRules' style (property names)
          for (var k = 0; k < styleSheets[i].cssRules[j].style.length; k++) {
            var name = styleSheets[i].cssRules[j].style[k]; // test name for css variable signiture and uniqueness

            if (name.startsWith('--') && cssVars.indexOf(name) == -1) {
              cssVars.push(name);
            }
          }
        } catch (error) {}
      }
    } catch (error) {}
  }

  return cssVars;
}

function getElementCSSVariables(allCSSVars) {
  var element = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.body;
  var pseudo = arguments.length > 2 ? arguments[2] : undefined;
  var elStyles = window.getComputedStyle(element, pseudo);
  var cssVars = {};

  for (var i = 0; i < allCSSVars.length; i++) {
    var key = allCSSVars[i];
    var value = elStyles.getPropertyValue(key);

    if (value) {
      cssVars[key] = value;
    }
  }

  return cssVars;
}

function inputGroup(params) {
  var inputGroups = document.getElementsByClassName('ig'); //console.log(inputGroups);

  for (var i = 0; i < inputGroups.length; i++) {
    var inputGroup = inputGroups[i]; //console.log(inputGroup);

    var inputs = inputGroup.getElementsByClassName('input'); //console.log(inputs);

    var firstButton = inputs[0].getElementsByClassName('ig-item')[0];
    var lastButton = inputs[inputs.length - 1].getElementsByClassName('ig-item')[0]; //console.log(firstButton);
    //console.log(lastButton);
    //for loop input without first and last item

    for (var j = 1; j < inputs.length - 1; j++) {
      var input = inputs[j]; //console.log('input = ', input);

      input.getElementsByClassName('ig-item')[0].style.borderRadius = '0px';
    }

    firstButton.style.borderRadius = '8px 0px 0px 8px ';
    firstButton.style.borderWidth = '2px 1px 2px 2px ';
    lastButton.style.borderRadius = '0px 8px 8px 0px ';
    lastButton.style.borderWidth = '2px 2px 2px 1px ';
  }
}

function initButtons(params) {
  var buttons = document.getElementsByTagName('button');

  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i]; //console.log('Check is Button Init? = ', btn.getAttribute('isInit'));

    if (!btn.getAttribute('isInit')) {
      btn.setAttribute('isInit', 'true');
      btn.addEventListener('click', function (e) {
        //console.log(this);
        // Create span element
        var rippleTop = document.createElement('span');
        var rippleBottom = document.createElement('span'); // Add ripple class to span

        rippleTop.classList.add('ripple');
        rippleBottom.classList.add('ripple');
        rippleTop.style.top = '0px';
        rippleBottom.style.bottom = '0px'; // Add span to the button

        this.appendChild(rippleTop);
        this.appendChild(rippleBottom); // Remove span after 0.3s

        setTimeout(function () {
          rippleTop.remove();
          rippleBottom.remove();
        }, 1000);
      });
    }
  }
}

function initSelect(params) {
  var selectWrappers = document.getElementsByClassName('select');

  for (var i = 0; i < selectWrappers.length; i++) {
    console.log('Check is Select Init? = ', selectWrappers[i].getAttribute('isInit'));

    if (!selectWrappers[i].getAttribute('isInit')) {
      selectWrappers[i].setAttribute('isInit', 'true');
      initSelectWrapper(selectWrappers[i]);
    }
  }
}

function initSelectWrapper(selectWrapper) {
  var select = selectWrapper.getElementsByTagName('select')[0];
  var selectedLabel = document.createElement('div');
  selectedLabel.classList.add('selectedValue');
  var optionsListWrapper = document.createElement('div');
  optionsListWrapper.classList.add('optionsListWrapper');
  var bar = document.createElement('div');
  bar.classList.add('bar');
  console.log(selectWrapper);
  selectWrapper.appendChild(selectedLabel);
  selectWrapper.appendChild(optionsListWrapper);
  selectWrapper.appendChild(bar);
  selectedLabel.innerHTML = select.value;
  var options = select.getElementsByTagName('option');

  var _loop = function _loop(j) {
    var option = options[j];
    optionWrapper = document.createElement('div');
    optionWrapper.classList.add('optionWrapper');
    optionWrapper.innerHTML = option.value;
    optionWrapper.value = option.value;
    optionsListWrapper.appendChild(optionWrapper);
    optionWrapper.addEventListener('click', function (e) {
      select.selectedIndex = j;

      if ('createEvent' in document) {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        select.dispatchEvent(evt);
      } else {
        select.fireEvent('onchange');
      }
    });
  };

  for (var j = 0; j < options.length; j++) {
    var optionWrapper;

    _loop(j);
  }

  select.addEventListener('change', function (e) {
    console.log('Select change event =', e.target.value);
    selectedLabel.innerHTML = e.target.value;
  });
  selectedLabel.addEventListener('click', function (e) {
    console.log('selectWrapper clicked'); //optionsListWrapper.classList.toggle('show');
  });
  selectWrapper.addEventListener('mouseenter', function (e) {
    console.log('selectWrapper mouseenter');
    optionsListWrapper.classList.add('show');
    bar.classList.add('show');
    selectWrapper.style.zIndex = '99';
  });
  selectWrapper.addEventListener('mouseleave', function (e) {
    console.log('selectWrapper mouseleave');
    optionsListWrapper.classList.remove('show');
    bar.classList.remove('show');
    selectWrapper.style.zIndex = '1';
  }); //console.log(options[0].value);
}

function initEmojiSelector() {
  rqstEmoji(function (emojis) {
    var select = document.getElementsByClassName('emojicontainer');
    console.log('emojicontainer = ');

    for (var i = 0; i < select.length; i++) {
      var element = select[i];

      for (var index = 0; index < emojis.length; index++) {
        var emoji = emojis[index];
        var emojiWrapper = document.createElement('div');
        emojiWrapper.classList.add('emojiWrapper');
        emojiWrapper.innerHTML = emoji.character;
        element.appendChild(emojiWrapper);
      }

      console.log('element = ', element);
    }
  });
}

function setSelectedValue(id, value) {}

function initProgress() {
  var progressWrappers = document.getElementsByClassName('progress');

  for (var index = 0; index < progressWrappers.length; index++) {
    var element = progressWrappers[index];

    if (!element.getAttribute('isInit')) {
      element.setAttribute('isInit', 'true');
      var bar = document.createElement('div');
      bar.classList.add('progress-bar');
      bar.style.width = element.getAttribute('value') + '%' || '0%';
      element.appendChild(bar);
    }
  }
}

function changeProgress(id, value) {
  var bar = document.getElementById(id).getElementsByClassName('progress-bar')[0];
  bar.style.width = value + '%';
  var barValue = parseInt(bar.style.width); //var iv = setInterval(frame, 5);

  function frame() {
    if (barValue > value) {
      barValue--;
      bar.style.width = barValue + '%';
    } else if (barValue < value) {
      barValue++;
      bar.style.width = barValue + '%';
    } else {
      clearInterval(iv);
    }
  }
}

function inithb(params) {
  //console.log('hb main.js loaded');
  inputGroup();
  initButtons();
  initSelect();
  initProgress();
  initEmojiSelector();
}

document.addEventListener('DOMContentLoaded', function () {
  // cache a list of known css variable names
  // update this list if you add new variable properties
  var cssVars = getAllCSSVariableNames();
  inithb();
  console.log(':root', getElementCSSVariables(cssVars, document.documentElement));
});

function rqstEmoji(callback) {
  var xmlhttp = new XMLHttpRequest();
  var url = 'emoji.json';

  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var myArr = JSON.parse(this.responseText);
      callback(myArr);
    }
  };

  xmlhttp.open('GET', url, true);
  xmlhttp.send();
}