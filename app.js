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
                    // Initialize as 'free' for non-assigned, 'occupied' for assigned
                    status[slotKey] = slot.assigned ? 'occupied' : 'free';
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

// Check if this is user's first visit
function isFirstVisit() {
    return !localStorage.getItem('has_visited_parking_app');
}

// Mark user as visited
function markAsVisited() {
    localStorage.setItem('has_visited_parking_app', 'true');
}

// Anonymize name: "Tal Gozlan" -> "Tal G."
function anonymizeName(fullName) {
    if (!fullName) return null;
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstName} ${lastInitial}.`;
}

// Track analytics event (with error handling)
function trackEvent(eventName, params = {}) {
    // Always log to console for immediate feedback during development
    console.log(`📊 Analytics Event: ${eventName}`, params);
    
    if (typeof analytics !== 'undefined') {
        try {
            analytics.logEvent(eventName, params);
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
    } else {
        console.warn('Analytics not available (Firebase not initialized)');
    }
}

// Toggle slot status
function toggleSlot(floor, slotNumber) {
    const slotKey = `${floor}_${slotNumber}`;
    
    getStatus((status) => {
        // Initialize if doesn't exist
        if (status[slotKey] === undefined) {
            status[slotKey] = 'free';
        }
        
        const oldStatus = status[slotKey];
        
        // Toggle between free and occupied (assigned slots can also be toggled)
        if (status[slotKey] === 'free' || status[slotKey] === 'assigned') {
            status[slotKey] = 'occupied';
        } else if (status[slotKey] === 'occupied') {
            // When freed, always become green (free), regardless of original assignment
            status[slotKey] = 'free';
        }
        
        // Get slot info for analytics
        const processedFloors = processParkingData();
        const slot = processedFloors
            .find(f => f.floor === floor)
            ?.slots.find(s => s.number === slotNumber);
        
        // Track analytics with anonymized name
        const assignedTo = slot?.name ? anonymizeName(slot.name) : null;
        trackEvent('slot_toggled', {
            floor: floor,
            slot_number: slotNumber,
            old_status: oldStatus,
            new_status: status[slotKey],
            is_assigned: slot?.assigned || false,
            assigned_to: assignedTo
        });
        
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
                    status[slotKey] = slot.assigned ? 'occupied' : 'free';
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
    
    // Otherwise, default based on assignment (assigned slots default to occupied)
    return isAssigned ? 'occupied' : 'free';
}

// Format floor name for display
function formatFloor(floor) {
    if (floor > 0) {
        return `Floor ${floor}`;
    }
    return `Level ${floor}`;
}

// Open modal
function openModal() {
    const modal = document.getElementById('usageModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        trackEvent('modal_opened');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('usageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        trackEvent('modal_closed');
    }
}

// Group double parking slots
function groupDoubleParkingSlots(slots) {
    const regular = [];
    const doubleGroups = [];
    const processed = new Set();
    
    slots.forEach(slot => {
        if (processed.has(slot.number)) return;
        
        if (slot.isDouble && slot.pairNumber) {
            const pair = slots.find(s => s.number === slot.pairNumber && !processed.has(s.number));
            if (pair) {
                doubleGroups.push([slot, pair]);
                processed.add(slot.number);
                processed.add(pair.number);
            } else {
                regular.push(slot);
                processed.add(slot.number);
            }
        } else {
            regular.push(slot);
            processed.add(slot.number);
        }
    });
    
    return { regular, doubleGroups };
}

// Render floor filter chips
function renderFloorFilters() {
    const container = document.getElementById('floorFilters');
    if (!container) return;
    
    container.innerHTML = '';
    
    const processedFloors = processParkingData();
    const availableFloors = processedFloors.map(f => f.floor);
    
    // Order: 1, 2, 4, -1, -2, -3, -4
    const floorOrder = [1, 2, 4, -1, -2, -3, -4];
    const floors = floorOrder.filter(floor => availableFloors.includes(floor));
    
    // Add "All" chip
    const allChip = document.createElement('button');
    allChip.className = 'filter-chip active';
    allChip.textContent = 'All';
    allChip.dataset.floor = 'all';
    allChip.addEventListener('click', () => filterFloors('all'));
    container.appendChild(allChip);
    
    // Add floor chips in specified order
    floors.forEach(floor => {
        const chip = document.createElement('button');
        chip.className = 'filter-chip';
        chip.textContent = formatFloor(floor);
        chip.dataset.floor = floor;
        chip.addEventListener('click', () => filterFloors(floor));
        container.appendChild(chip);
    });
}

// Filter floors by selection
function filterFloors(selectedFloor) {
    // Update active chip
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        if (chip.dataset.floor === String(selectedFloor)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    
    // Show/hide floor sections
    const floorSections = document.querySelectorAll('.floor-section');
    floorSections.forEach(section => {
        const floorNumber = parseInt(section.dataset.floor);
        if (selectedFloor === 'all' || floorNumber === selectedFloor) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    trackEvent('floor_filtered', { floor: selectedFloor });
}

// Render floor divider
function renderFloorDivider(floorNumber) {
    const divider = document.createElement('div');
    divider.className = 'floor-divider';
    
    const label = document.createElement('div');
    label.className = 'floor-divider-label';
    label.textContent = formatFloor(floorNumber);
    
    divider.appendChild(label);
    return divider;
}

// Render status badge
function renderStatusBadge(status) {
    const badge = document.createElement('div');
    badge.className = 'status-badge';
    badge.textContent = status === 'free' ? 'Available' : 'Occupied';
    return badge;
}

// Render parking slot card
function renderParkingSlot(floor, slot, status) {
    const slotElement = document.createElement('div');
    slotElement.className = `parking-slot ${status}`;
    
    // Anonymize name for display (privacy)
    const displayName = slot.name ? anonymizeName(slot.name) : null;
    
    // Create content wrapper for proper spacing
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.justifyContent = 'space-between';
    contentWrapper.style.height = '100%';
    contentWrapper.style.width = '100%';
    
    // Slot number (top)
    const numberElement = document.createElement('div');
    numberElement.className = 'slot-number';
    numberElement.textContent = slot.number;
    contentWrapper.appendChild(numberElement);
    
    // Status badge (middle)
    const badge = renderStatusBadge(status);
    contentWrapper.appendChild(badge);
    
    // Name (bottom, if exists)
    if (displayName) {
        const nameElement = document.createElement('div');
        nameElement.className = 'slot-name';
        nameElement.textContent = displayName;
        contentWrapper.appendChild(nameElement);
    } else {
        // Add spacer to maintain consistent height
        const spacer = document.createElement('div');
        spacer.style.height = '16px';
        spacer.style.flexShrink = '0';
        contentWrapper.appendChild(spacer);
    }
    
    slotElement.appendChild(contentWrapper);
    
    // Make all slots clickable
    slotElement.addEventListener('click', () => {
        toggleSlot(floor, slot.number);
    });
    
    return slotElement;
}

// Render parking slots
function renderParking() {
    const container = document.getElementById('floorsContainer');
    container.innerHTML = '';

    const processedFloors = processParkingData();

    processedFloors.forEach(floor => {
        const floorSection = document.createElement('div');
        floorSection.className = 'floor-section';
        floorSection.dataset.floor = floor.floor;

        // Add floor divider
        const divider = renderFloorDivider(floor.floor);
        floorSection.appendChild(divider);

        // Custom arrangement for specific floors (preserve existing logic)
        let sortedSlots = [...floor.slots];
        
        if (floor.floor === 2) {
            // Floor 2: simple sort, let grouping handle the arrangement
            sortedSlots.sort((a, b) => a.number - b.number);
        } else if (floor.floor === -2) {
            const slotMap = new Map(sortedSlots.map(s => [s.number, s]));
            sortedSlots = [
                slotMap.get(29), slotMap.get(31), slotMap.get(350),
                slotMap.get(30), slotMap.get(308), slotMap.get(351)
            ].filter(Boolean);
        } else if (floor.floor === -3) {
            const slotMap = new Map(sortedSlots.map(s => [s.number, s]));
            sortedSlots = [
                slotMap.get(47), slotMap.get(49), slotMap.get(338), slotMap.get(336),
                slotMap.get(48), slotMap.get(335), slotMap.get(337), slotMap.get(339)
            ].filter(Boolean);
        } else if (floor.floor === -4) {
            const slotMap = new Map(sortedSlots.map(s => [s.number, s]));
            const rest = [19, 240, 241, 242, 243].map(n => slotMap.get(n)).filter(Boolean);
            sortedSlots = [
                slotMap.get(238), rest[0], rest[2],
                slotMap.get(239), rest[1], rest[3],
                rest[4]
            ].filter(Boolean);
        } else {
            sortedSlots.sort((a, b) => a.number - b.number);
        }

        // Group slots: regular and double parking
        const { regular, doubleGroups } = groupDoubleParkingSlots(sortedSlots);

        // Create grid container
        const grid = document.createElement('div');
        
        // Determine grid layout
        if (floor.floor === 1 || floor.floor === -1 || floor.floor === 4) {
            grid.className = 'parking-grid parking-grid-standard';
        } else {
            grid.className = 'parking-grid parking-grid-doubles';
        }

        // For floors with doubles layout, render double parking groups first
        // They will span 2 columns and align at the top
        if (floor.floor === 2 || floor.floor === -2 || floor.floor === -3 || floor.floor === -4) {
            doubleGroups.forEach(group => {
                const container = document.createElement('div');
                container.className = 'double-parking-group';
                
                const label = document.createElement('div');
                label.className = 'double-parking-label';
                label.textContent = 'Double Parking';
                container.appendChild(label);
                
                const slotsContainer = document.createElement('div');
                slotsContainer.className = 'double-parking-slots';
                
                group.forEach(slot => {
                    const status = getSlotStatus(floor.floor, slot.number, slot.assigned);
                    const slotElement = renderParkingSlot(floor.floor, slot, status);
                    slotsContainer.appendChild(slotElement);
                });
                
                container.appendChild(slotsContainer);
                grid.appendChild(container);
            });
        }

        // Render regular slots
        regular.forEach(slot => {
            const status = getSlotStatus(floor.floor, slot.number, slot.assigned);
            const slotElement = renderParkingSlot(floor.floor, slot, status);
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
    
    // Check first visit and open modal
    if (isFirstVisit()) {
        trackEvent('first_visit');
        markAsVisited();
        // Open modal on first visit
        setTimeout(() => openModal(), 300);
    }
    
    // Track app load
    trackEvent('app_loaded');
    
    // Setup real-time listener first (if Firebase is available)
    setupRealtimeListener();
    
    // Initialize status (this will also trigger initial render)
    initializeStatus();
    
    // Render floor filters
    renderFloorFilters();
    
    // Set up modal handlers
    const infoIcon = document.getElementById('infoIcon');
    if (infoIcon) {
        infoIcon.addEventListener('click', openModal);
    }
    
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
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

