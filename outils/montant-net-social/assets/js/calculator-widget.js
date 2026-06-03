/**
 * CALCULATRICE FLOTTANTE - Déplaçable et élégante
 */

(() => {
  'use strict';

  let calcWindow = null;
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;
  let xOffset = 0;
  let yOffset = 0;

  function initCalculator() {
    // Créer le bouton toggle
    const toggleHTML = `
      <div class="calc-toggle">
        <button id="calc-toggle-btn" title="Ouvrir la calculatrice">🔢</button>
      </div>
    `;

    // Créer la fenêtre calculatrice
    const windowHTML = `
      <div class="calc-window" id="calc-window">
        <div class="calc-header" id="calc-header">
          <span>Calculatrice</span>
          <button class="calc-close" id="calc-close">×</button>
        </div>
        <div class="calc-body">
          <div class="calc-display" id="calc-display">0</div>
          <div class="calc-buttons">
            <button class="calc-btn" data-value="7">7</button>
            <button class="calc-btn" data-value="8">8</button>
            <button class="calc-btn" data-value="9">9</button>
            <button class="calc-btn operator" data-value="/">÷</button>
            
            <button class="calc-btn" data-value="4">4</button>
            <button class="calc-btn" data-value="5">5</button>
            <button class="calc-btn" data-value="6">6</button>
            <button class="calc-btn operator" data-value="*">×</button>
            
            <button class="calc-btn" data-value="1">1</button>
            <button class="calc-btn" data-value="2">2</button>
            <button class="calc-btn" data-value="3">3</button>
            <button class="calc-btn operator" data-value="-">−</button>
            
            <button class="calc-btn" data-value="0">0</button>
            <button class="calc-btn" data-value=".">.</button>
            <button class="calc-btn operator" data-value="C">C</button>
            <button class="calc-btn operator" data-value="+">+</button>
            
            <button class="calc-btn equals" data-value="=">=</button>
            <button class="calc-btn operator" data-value="⌫">⌫</button>
          </div>
        </div>
      </div>
    `;

    // Insérer dans le DOM
    document.body.insertAdjacentHTML('beforeend', toggleHTML);
    document.body.insertAdjacentHTML('beforeend', windowHTML);

    // Récupérer les éléments
    calcWindow = document.getElementById('calc-window');
    const toggleBtn = document.getElementById('calc-toggle-btn');
    const closeBtn = document.getElementById('calc-close');
    const header = document.getElementById('calc-header');
    const display = document.getElementById('calc-display');

    // État de la calculatrice
    let currentValue = '0';
    let previousValue = '';
    let operation = '';
    let shouldResetScreen = false;

    // Toggle affichage
    toggleBtn.addEventListener('click', () => {
      const isVisible = calcWindow.classList.contains('show');
      if (isVisible) {
        calcWindow.classList.remove('show');
      } else {
        calcWindow.classList.add('show');
      }
    });

    // Fermer
    closeBtn.addEventListener('click', () => {
      calcWindow.classList.remove('show');
    });

    // Drag & drop
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Touch support
    header.addEventListener('touchstart', dragStart, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);

    // Boutons calculatrice
    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        
        if (value === 'C') {
          currentValue = '0';
          previousValue = '';
          operation = '';
          shouldResetScreen = false;
          display.textContent = '0';
          return;
        }

        if (value === '⌫') {
          if (currentValue.length > 1) {
            currentValue = currentValue.slice(0, -1);
          } else {
            currentValue = '0';
          }
          display.textContent = currentValue;
          return;
        }

        if (value === '=') {
          if (previousValue && operation) {
            const result = calculate(parseFloat(previousValue), parseFloat(currentValue), operation);
            display.textContent = result;
            currentValue = result.toString();
            previousValue = '';
            operation = '';
          }
          return;
        }

        if (['+', '-', '*', '/'].includes(value)) {
          if (previousValue && operation && !shouldResetScreen) {
            const result = calculate(parseFloat(previousValue), parseFloat(currentValue), operation);
            display.textContent = result;
            currentValue = result.toString();
          }
          previousValue = currentValue;
          operation = value;
          shouldResetScreen = true;
          return;
        }

        // Nombres et point décimal
        if (shouldResetScreen) {
          currentValue = value;
          shouldResetScreen = false;
        } else {
          if (currentValue === '0' && value !== '.') {
            currentValue = value;
          } else {
            if (value === '.' && currentValue.includes('.')) return;
            currentValue += value;
          }
        }

        display.textContent = currentValue;
      });
    });

    console.log('✓ Calculatrice initialisée');
  }

  function calculate(a, b, op) {
    switch (op) {
      case '+': return (a + b).toFixed(2);
      case '-': return (a - b).toFixed(2);
      case '*': return (a * b).toFixed(2);
      case '/': return b !== 0 ? (a / b).toFixed(2) : 'Erreur';
      default: return b;
    }
  }

  function dragStart(e) {
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === document.getElementById('calc-header') || 
        e.target.parentElement === document.getElementById('calc-header')) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, calcWindow);
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  // Initialiser au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }
})();
