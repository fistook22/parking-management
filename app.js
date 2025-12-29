// Parse double parking notes to extract the second slot number
function parseDoubleParking(notes) {
    if (!notes || !notes.includes('כפולה')) return null;
    const match = notes.match(/\+?\s*(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Process parking data and expand double parking slots
function processParkingData() {
    const processedFloors = parkingData.floors.map(floor => {
        const processedSlots = [];
        
        floor.slots.forEach(slot => {
            // Check if this is a double parking slot
            const secondSlotNumber = parseDoubleParking(slot.notes);
            
            if (secondSlotNumber) {
                // Create two slots for double parking
                processedSlots.push({
                    number: slot.number,
                    name: slot.name,
                    assigned: slot.assigned,
                    notes: null,
                    isDouble: true,
                    pairNumber: secondSlotNumber
                });
                processedSlots.push({
                    number: secondSlotNumber,
                    name: null,
                    assigned: slot.assigned,
                    notes: null,
                    isDouble: true,
                    pairNumber: slot.number
                });
            } else {
                // Regular slot
                processedSlots.push({
                    number: slot.number,
                    name: slot.name,
                    assigned: slot.assigned,
                    notes: slot.notes && !slot.notes.includes('כפולה') ? slot.notes : null
                });
            }
        });
        
        return {
            ...floor,
            slots: processedSlots
        };
    });
    
    return processedFloors;
}

// Parking data from the image
const parkingData = {
    floors: [
        {
            floor: 1,
            color: 'floor-1',
            slots: [
                { number: 40, name: 'Tal Gozlan', assigned: true },
                { number: 41, name: 'Miri Blima', assigned: true }
            ]
        },
        {
            floor: 2,
            color: 'floor-2',
            slots: [
                { number: 1, name: 'Shai Finkelstein', assigned: true, notes: 'חנייה כפולה + 2 (ספקים)' },
                { number: 3, name: null, assigned: false, notes: 'חנייה כפולה + 4' },
                { number: 5, name: null, assigned: false, notes: 'חנייה כפולה + 6' }
            ]
        },
        {
            floor: 4,
            color: 'floor-4',
            slots: [
                { number: 45, name: 'Omri Ben-Simon', assigned: true },
                { number: 46, name: 'Noam Kahana', assigned: true }
            ]
        },
        {
            floor: -1,
            color: 'floor-neg1',
            slots: [
                { number: 92, name: 'Chen Ovadia', assigned: true },
                { number: 93, name: 'Itzik Bachar', assigned: true }
            ]
        },
        {
            floor: -2,
            color: 'floor-neg2',
            slots: [
                { number: 29, name: 'Jordan Ferenz', assigned: true },
                { number: 30, name: 'Yuval Leikin', assigned: true },
                { number: 31, name: 'Haim Lazarov', assigned: true },
                { number: 308, name: 'David Kotin', assigned: true },
                { number: 350, name: null, assigned: false, notes: 'חניה כפולה + 351' }
            ]
        },
        {
            floor: -3,
            color: 'floor-neg3',
            slots: [
                { number: 47, name: 'Ehab Jaber', assigned: true },
                { number: 48, name: 'Eden Gita Gueta', assigned: true },
                { number: 49, name: 'Roii Gurevitch', assigned: true },
                { number: 335, name: 'Lia Cohen', assigned: true },
                { number: 338, name: 'Tal Zamir', assigned: true },
                { number: 339, name: 'Alpir Kritzler', assigned: true },
                { number: 336, name: null, assigned: false, notes: 'חניה כפולה + 337' }
            ]
        },
        {
            floor: -4,
            color: 'floor-neg4',
            slots: [
                { number: 19, name: 'Matti Brand', assigned: true },
                { number: 243, name: 'Yair Furman', assigned: true },
                { number: 238, name: null, assigned: false, notes: 'חניה כפולה + 239' },
                { number: 240, name: null, assigned: false },
                { number: 241, name: null, assigned: false },
                { number: 242, name: null, assigned: false }
            ]
        }
    ]
};

// Storage key with date for daily reset
function getStorageKey() {
    const today = new Date().toDateString();
    return `parking_status_${today}`;
}

// Get current status from Firebase (with localStorage fallback)
function getStatus(callback) {
    const key = getStorageKey();
    
    // If callback provided, use async Firebase
    if (callback) {
        if (typeof database !== 'undefined') {
            const statusRef = database.ref(`parking/${key}`);
            statusRef.once('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Update localStorage with latest data
                    localStorage.setItem(key, JSON.stringify(data));
                    callback(data);
                } else {
                    // Fallback to localStorage
                    const stored = localStorage.getItem(key);
                    callback(stored ? JSON.parse(stored) : {});
                }
            }, (error) => {
                console.warn('Firebase read error, using localStorage:', error);
                const stored = localStorage.getItem(key);
                callback(stored ? JSON.parse(stored) : {});
            });
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem(key);
            callback(stored ? JSON.parse(stored) : {});
        }
        return;
    }
    
    // Synchronous version for rendering (uses localStorage)
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
}

// Save status to Firebase (with localStorage backup)
function saveStatus(status) {
    const key = getStorageKey();
    
    // Save to Firebase
    if (typeof database !== 'undefined') {
        database.ref(`parking/${key}`).set(status).catch((error) => {
            console.warn('Firebase write error, using localStorage only:', error);
        });
    }
    
    // Also save to localStorage as backup
    localStorage.setItem(key, JSON.stringify(status));
}

// Listen for real-time updates from Firebase
function setupRealtimeListener() {
    if (typeof database === 'undefined') {
        console.log('Firebase not available, using localStorage only');
        return;
    }
    
    const key = getStorageKey();
    const statusRef = database.ref(`parking/${key}`);
    
    statusRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Update localStorage with latest data
            localStorage.setItem(key, JSON.stringify(data));
            // Re-render parking slots
            renderParking();
        }
    }, (error) => {
        console.warn('Firebase listener error:', error);
    });
    
    console.log('Real-time listener active');
}

// Initialize status for all slots
function initializeStatus() {
    getStatus((status) => {
        let changed = false;
        const processedFloors = processParkingData();

        processedFloors.forEach(floor => {
            floor.slots.forEach(slot => {
                const slotKey = `${floor.floor}_${slot.number}`;
                if (status[slotKey] === undefined) {
                    // Initialize as 'free' for non-assigned, 'assigned' for assigned
                    status[slotKey] = slot.assigned ? 'assigned' : 'free';
                    changed = true;
                }
            });
        });

        if (changed) {
            saveStatus(status);
        }
        
        // Initial render after initialization
        renderParking();
    });
}

// Toggle slot status
function toggleSlot(floor, slotNumber) {
    const slotKey = `${floor}_${slotNumber}`;
    
    getStatus((status) => {
        // Initialize if doesn't exist
        if (status[slotKey] === undefined) {
            status[slotKey] = 'free';
        }
        
        // Toggle between free and occupied (assigned slots can also be toggled)
        if (status[slotKey] === 'free' || status[slotKey] === 'assigned') {
            status[slotKey] = 'occupied';
        } else if (status[slotKey] === 'occupied') {
            // Check if this slot was originally assigned
            const processedFloors = processParkingData();
            const slot = processedFloors
                .find(f => f.floor === floor)
                ?.slots.find(s => s.number === slotNumber);
            
            status[slotKey] = slot?.assigned ? 'assigned' : 'free';
        }
        
        saveStatus(status);
        // renderParking() will be called automatically by real-time listener if Firebase is active
        // Otherwise, render immediately
        if (typeof database === 'undefined') {
            renderParking();
        }
    });
}

// Reset all slots for today
function resetAll() {
    if (confirm('Reset all parking slots to free for today?')) {
        getStatus((status) => {
            const processedFloors = processParkingData();
            
            // Reset all slots to their default state
            processedFloors.forEach(floor => {
                floor.slots.forEach(slot => {
                    const slotKey = `${floor.floor}_${slot.number}`;
                    status[slotKey] = slot.assigned ? 'assigned' : 'free';
                });
            });
            
            saveStatus(status);
            // renderParking() will be called automatically by real-time listener if Firebase is active
            if (typeof database === 'undefined') {
                renderParking();
            }
        });
    }
}

// Get slot status
function getSlotStatus(floor, slotNumber, isAssigned) {
    const status = getStatus();
    const slotKey = `${floor}_${slotNumber}`;
    
    // If status exists in storage, use it
    if (status[slotKey] !== undefined) {
        return status[slotKey];
    }
    
    // Otherwise, default based on assignment
    return isAssigned ? 'assigned' : 'free';
}

// Format floor name
function formatFloor(floor) {
    if (floor > 0) {
        return `Floor ${floor}`;
    }
    return `Floor ${floor}`;
}

// Render parking slots
function renderParking() {
    const container = document.getElementById('floorsContainer');
    container.innerHTML = '';

    const processedFloors = processParkingData();

    processedFloors.forEach(floor => {
        const floorSection = document.createElement('div');
        floorSection.className = 'floor-section';

        const floorHeader = document.createElement('div');
        floorHeader.className = `floor-header ${floor.color}`;
        floorHeader.textContent = formatFloor(floor.floor);
        floorSection.appendChild(floorHeader);

        const grid = document.createElement('div');
        grid.className = 'parking-grid';

        floor.slots.forEach(slot => {
            const slotElement = document.createElement('div');
            const status = getSlotStatus(floor.floor, slot.number, slot.assigned);
            
            slotElement.className = `parking-slot ${status}`;
            
            // Show double parking indicator if applicable
            const doubleIndicator = slot.isDouble ? ' (Double)' : '';
            
            slotElement.innerHTML = `
                <div class="slot-number">${slot.number}${doubleIndicator}</div>
                ${slot.name ? `<div class="slot-name">${slot.name}</div>` : ''}
                ${slot.notes ? `<div class="slot-notes">${slot.notes}</div>` : ''}
            `;

            // Make all slots clickable (including assigned ones)
            slotElement.addEventListener('click', () => {
                toggleSlot(floor.floor, slot.number);
            });

            grid.appendChild(slotElement);
        });

        floorSection.appendChild(grid);
        container.appendChild(floorSection);
    });
}

// Update date display
function updateDateDisplay() {
    const dateDisplay = document.getElementById('dateDisplay');
    const today = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateDisplay.textContent = today.toLocaleDateString('en-US', options);
}

// Check for daily reset (runs every minute)
function checkDailyReset() {
    const lastReset = localStorage.getItem('last_reset_date');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        // New day - clear old data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('parking_status_')) {
                localStorage.removeItem(key);
            }
        });
        localStorage.setItem('last_reset_date', today);
        renderParking();
    }
}

// Initialize app
function init() {
    updateDateDisplay();
    
    // Setup real-time listener first (if Firebase is available)
    setupRealtimeListener();
    
    // Initialize status (this will also trigger initial render)
    initializeStatus();
    
    // Set up reset button
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    
    // Check for daily reset every minute
    setInterval(checkDailyReset, 60000);
    
    // Initial daily reset check
    checkDailyReset();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

