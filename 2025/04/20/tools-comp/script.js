// Global variable to hold symbol arrays loaded from the file
let symbolsArrays = [];

const reelContainers = document.querySelectorAll('.reel-container');
const spinButton = document.getElementById('spinButton');
const resultsDisplay = document.getElementById('results');

const symbolHeight = 120; // Must match .symbol height and .reel-container height in CSS
const numRepetitions = 10; // Increased repetitions

// Disable the button initially until symbols are loaded
spinButton.disabled = true;

// --- Load symbols from the text file ---
fetch('slot_machine.txt')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Check if the loaded data is valid (an array of at least 3 arrays)
        if (!Array.isArray(data) || data.length < 3 || !data.every(Array.isArray)) {
            throw new Error('Invalid symbol data format in slot_machine.txt');
        }
        symbolsArrays = data; // Assign loaded data to the global variable
        console.log('Symbols loaded successfully:', symbolsArrays);

        // Populate the reels now that symbols are loaded
        reelContainers.forEach((reelElement, index) => {
            populateReel(reelElement, index);
        });

        // Enable the spin button
        spinButton.disabled = false;
        resultsDisplay.textContent = '结果: 可以开始!'; // Update status

    })
    .catch(error => {
        console.error('Error loading symbols:', error);
        resultsDisplay.textContent = '错误: 无法加载符号文件。请通过Web服务器运行。';
        // Keep button disabled on error
    });


// Function to populate a single reel with symbols based on its index
function populateReel(reelElement, reelIndex) {
    const symbolsDiv = reelElement.querySelector('.reel-symbols');
    const symbols = symbolsArrays[reelIndex]; // Get the correct symbol array for this reel
    symbolsDiv.innerHTML = ''; // Clear previous symbols

    if (!symbols) {
        console.error(`Symbols not found for reel index ${reelIndex}`);
        return; // Prevent error if symbolsArrays is not correctly populated
    }

    // Add symbols multiple times to simulate a long strip
    for (let i = 0; i < numRepetitions; i++) {
        symbols.forEach(symbol => {
            const symbolDiv = document.createElement('div');
            symbolDiv.classList.add('symbol');
            symbolDiv.textContent = symbol;
            symbolsDiv.appendChild(symbolDiv);
        });
    }
}


// Function to spin a single reel to a specific target symbol index
function spinReel(reelElement, targetSymbolIndex, reelIndex) {
    return new Promise((resolve) => {
        const symbolsDiv = reelElement.querySelector('.reel-symbols');
        const symbols = symbolsArrays[reelIndex]; // Get symbols for this reel
        const totalSymbolsHeight = symbolHeight * symbols.length; // Calculate total height of one symbol set

        // Remove any existing transition to allow instant reset
        symbolsDiv.style.transition = 'none';

        // Calculate the height needed to show the first set of symbols
        const initialResetPosition = 0; // Start at the top of the first set
        symbolsDiv.style.transform = `translateY(${initialResetPosition}px)`;


        // Use a small timeout to allow the reset transform to apply before the spin transition starts
        setTimeout(() => {
             // Calculate the target position for the spin animation
             // Spin down multiple full sets + the distance to the target symbol
             // Adding some random "momentum" spins (e.g., 5 to 10 full spins)
             const randomFullSpins = Math.floor(Math.random() * 6) + 5; // Spin at least 5, up to 10 full sets
             const targetPosition = -(randomFullSpins * totalSymbolsHeight + targetSymbolIndex * symbolHeight);

             // Set the transition property for the spin animation
             symbolsDiv.style.transition = 'transform 4000ms cubic-bezier(0.1, 0.3, 0.2, 1)'; // Smooth ease-out

             // Apply the transform to start the spin animation
             symbolsDiv.style.transform = `translateY(${targetPosition}px)`;

             // Listen for the transition to end
             symbolsDiv.addEventListener('transitionend', function handler() {
                 symbolsDiv.removeEventListener('transitionend', handler);

                 // --- Snap to the correct visual position ---
                 // After the animation stops, instantly snap the reel to the position
                 // corresponding to the winning symbol within the *first* set of symbols.
                 // This makes it look like the reel stopped on the symbol you see.
                 const snapPosition = -(targetSymbolIndex * symbolHeight);
                 symbolsDiv.style.transition = 'none'; // Disable transition for instant snap
                 symbolsDiv.style.transform = `translateY(${snapPosition}px)`;
                 // ------------------------------------------

                 resolve(targetSymbolIndex); // Resolve the promise with the winning index
             });

        }, 50); // Small delay to ensure reset applies
    });
}


// Spin button click handler
spinButton.addEventListener('click', async () => {
    if (spinButton.disabled) return; // Prevent double clicks if somehow enabled

    spinButton.disabled = true; // Disable button while spinning
    resultsDisplay.textContent = '结果: 旋转中...'; // Update results display

    const targetIndexes = []; // To store the determined target index for each reel

    // --- Determine the target results based on the logic ---
    // Ensure symbolsArrays is loaded before proceeding
    if (symbolsArrays.length < 3) {
         console.error("Symbols not loaded yet.");
         resultsDisplay.textContent = '错误: 符号未加载，请稍候或刷新。';
         spinButton.disabled = false; // Re-enable if click happens before load
         return;
    }

    const symbolsReel1 = symbolsArrays[0];
    const symbolsReel2 = symbolsArrays[1];
    const symbolsReel3 = symbolsArrays[2];

    // 1. Determine Reel 1 result first
    const targetIndex1 = Math.floor(Math.random() * symbolsReel1.length);
    const result1 = symbolsReel1[targetIndex1];
    targetIndexes.push(targetIndex1); // Store the target index for reel 1

    let targetIndex2, targetIndex3;

    // 2. Determine Reel 2 and Reel 3 results based on Reel 1 result
    if (result1 === '啤酒') {
        targetIndex2 = symbolsReel2.indexOf('啤酒'); // Find index of '啤酒' in reel 2 symbols
        targetIndex3 = symbolsReel3.indexOf('啤酒'); // Find index of '啤酒' in reel 3 symbols
         // Basic check if '啤酒' exists in all lists - should always be true with the provided data
         if (targetIndex2 === -1 || targetIndex3 === -1) {
             console.error("Error: '啤酒' not found in all required symbol lists for win condition.");
             // Fallback - maybe select a random non-win state or show error
             // For now, just log the error and proceed with potentially incorrect indices (-1)
         }
    } else if (result1 === '预调酒') {
        targetIndex2 = symbolsReel2.indexOf('预调酒'); // Find index of '预调酒' in reel 2 symbols
        targetIndex3 = symbolsReel3.indexOf('预调酒'); // Find index of '预调酒' in reel 3 symbols
         // Basic check if '预调酒' exists in all lists
         if (targetIndex2 === -1 || targetIndex3 === -1) {
             console.error("Error: '预调酒' not found in all required symbol lists for win condition.");
             // Fallback similarly
         }
    } else {
        // If R1 is neither, R2 and R3 cannot be '啤酒' or '预调酒'
        const allowedSymbols2 = symbolsReel2.filter(item => item !== '啤酒' && item !== '预调酒');
        const allowedSymbols3 = symbolsReel3.filter(item => item !== '啤酒' && item !== '预调酒');

        // Handle cases where allowedSymbols might be empty (unlikely with current lists)
        const chosenSymbol2 = allowedSymbols2.length > 0 ? allowedSymbols2[Math.floor(Math.random() * allowedSymbols2.length)] : symbolsReel2[0]; // Default to first symbol if empty
        const chosenSymbol3 = allowedSymbols3.length > 0 ? allowedSymbols3[Math.floor(Math.random() * allowedSymbols3.length)] : symbolsReel3[0]; // Default to first symbol if empty


        // Find the index of the chosen symbols in the *original* full lists
        targetIndex2 = symbolsReel2.indexOf(chosenSymbol2);
        targetIndex3 = symbolsReel3.indexOf(chosenSymbol3);

         // Check if finding the index was successful (should be unless fallback used)
         if (targetIndex2 === -1 || targetIndex3 === -1) {
             console.error("Error: Could not find selected allowed symbol in original list.");
             // Handle error or use fallback index
             targetIndex2 = Math.max(0, targetIndex2); // Ensure index is not -1
             targetIndex3 = Math.max(0, targetIndex3); // Ensure index is not -1
         }
    }

    targetIndexes.push(targetIndex2); // Store the target index for reel 2
    targetIndexes.push(targetIndex3); // Store the target index for reel 3


    // --- Now start spinning each reel with the determined target index ---
    const spinPromises = [];
    reelContainers.forEach((reelElement, index) => {
        const targetIndex = targetIndexes[index];
         // Add a small staggered delay for visual effect
         const delay = index * 150; // Delay subsequent reels by 150ms
        spinPromises.push(
            new Promise(resolve => setTimeout(() => {
                spinReel(reelElement, targetIndex, index).then(resolve);
            }, delay))
        );
    });

    // Wait for all reels to finish spinning
    const finalResultsIndices = await Promise.all(spinPromises);

    // --- Determine final symbols and check for win ---
    const finalResultSymbols = finalResultsIndices.map((index, reelIndex) => symbolsArrays[reelIndex][index]);

    // Check for the specific win conditions (all '啤酒' or all '预调酒')
    const isBeerWin = finalResultSymbols[0] === '啤酒' && finalResultSymbols[1] === '啤酒' && finalResultSymbols[2] === '啤酒';
    const isPreMixedWin = finalResultSymbols[0] === '预调酒' && finalResultSymbols[1] === '预调酒' && finalResultSymbols[2] === '预调酒';


    // --- Update results display and handle win state ---
    if (isBeerWin) {
        resultsDisplay.textContent = '结果：啤酒！';
        // Trigger confetti effect
        confetti({ origin: { y: 0.6 }, count: 100, spread: 90 });
        //alert('太棒了！干杯！');
		spinButton.disabled = false;
        // Button remains disabled
    } else if (isPreMixedWin) {
        resultsDisplay.textContent = '结果：预调酒！';
         // Trigger confetti effect
        confetti({ origin: { y: 0.6 }, count: 100, spread: 90 });
        //alert('太棒了！干杯！');
		spinButton.disabled = false;
        // Button remains disabled
    } else {
        // Not a win, display all symbols
        resultsDisplay.textContent = `结果: ${finalResultSymbols[0]}, ${finalResultSymbols[1]}, ${finalResultSymbols[2]}`;
		confetti({ origin: { y: 0.6 }, count: 100, spread: 90 });
        // alert('再试一次！'); // Optional lose message
        // Re-enable button for another spin
        spinButton.disabled = false;
    }

    console.log("Spin finished. Results:", finalResultSymbols);

});

// Initial state setup - The fetch promise handles initial population