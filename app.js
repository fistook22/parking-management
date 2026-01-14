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
                { number: 42, name: 'Tal Gozlan', assigned: true }
            ]
        },
        {
            floor: 2,
            color: 'floor-2',
            slots: [
                { number: 3, name: 'Shai Finkelstein', assigned: true, notes: 'חנייה כפולה + 4 (ספקים)' },
                { number: 5, name: null, assigned: false, notes: 'חנייה כפולה + 6' }
            ]
        },
        {
            floor: 3,
            color: 'floor-3',
            slots: [
                { number: 94, name: null, assigned: false, notes: 'חנייה כפולה + 95' }
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
                { number: 50, name: 'Matti Brand', assigned: true },
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
                    // Migrate data from object format to string format if needed
                    const migrated = migrateStatusData(data);
                    if (migrated) {
                        console.log('Data migrated during getStatus, saving back...');
                        // Save migrated data back to Firebase
                        statusRef.set(data).catch((error) => {
                            console.warn('Error saving migrated data:', error);
                        });
                    }
                    
                    // Update localStorage with latest data
                    localStorage.setItem(key, JSON.stringify(data));
                    callback(data);
                } else {
                    // Fallback to localStorage
                    const stored = localStorage.getItem(key);
                    const parsed = stored ? JSON.parse(stored) : {};
                    // Migrate localStorage data too
                    migrateStatusData(parsed);
                    callback(parsed);
                }
            }, (error) => {
                console.warn('Firebase read error, using localStorage:', error);
                const stored = localStorage.getItem(key);
                const parsed = stored ? JSON.parse(stored) : {};
                // Migrate localStorage data too
                migrateStatusData(parsed);
                callback(parsed);
            });
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem(key);
            const parsed = stored ? JSON.parse(stored) : {};
            // Migrate localStorage data too
            migrateStatusData(parsed);
            callback(parsed);
        }
        return;
    }
    
    // Synchronous version for rendering (uses localStorage)
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : {};
    // Migrate localStorage data too
    migrateStatusData(parsed);
    return parsed;
}

// Migrate status data from object format to string format
function migrateStatusData(status) {
    let changed = false;
    const processedFloors = processParkingData();
    
    processedFloors.forEach(floor => {
        floor.slots.forEach(slot => {
            const slotKey = `${floor.floor}_${slot.number}`;
            const currentValue = status[slotKey];
            
            if (currentValue !== undefined && currentValue !== null) {
                if (typeof currentValue === 'object') {
                    // Migrate from object format to string format
                    const extractedStatus = currentValue.status;
                    if (extractedStatus && typeof extractedStatus === 'string') {
                        status[slotKey] = extractedStatus;
                        changed = true;
                        console.log(`Migrated ${slotKey} from object to string: ${extractedStatus}`);
                    } else {
                        // Invalid object, use default
                        status[slotKey] = slot.assigned ? 'occupied' : 'free';
                        changed = true;
                        console.log(`Fixed invalid object for ${slotKey}: ${status[slotKey]}`);
                    }
                } else if (typeof currentValue !== 'string') {
                    // Invalid type, reset to default
                    status[slotKey] = slot.assigned ? 'occupied' : 'free';
                    changed = true;
                    console.log(`Fixed invalid type for ${slotKey}: ${status[slotKey]}`);
                }
            }
        });
    });
    
    return changed;
}

// Save status to Firebase (with localStorage backup)
function saveStatus(status) {
    // Always migrate data before saving to ensure it's in string format
    const migrated = migrateStatusData(status);
    if (migrated) {
        console.log('Data migrated during save');
    }
    
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
            // Migrate data from object format to string format if needed
            const migrated = migrateStatusData(data);
            if (migrated) {
                console.log('Data migrated from Firebase, saving back...');
                // Save migrated data back to Firebase
                statusRef.set(data).catch((error) => {
                    console.warn('Error saving migrated data:', error);
                });
            }
            
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

        // First, migrate any object format data to string format
        const migrated = migrateStatusData(status);
        if (migrated) {
            changed = true;
            console.log('Data migrated during initialization');
        }

        // Then initialize any missing slots
        processedFloors.forEach(floor => {
            floor.slots.forEach(slot => {
                const slotKey = `${floor.floor}_${slot.number}`;
                if (status[slotKey] === undefined || status[slotKey] === null) {
                    // Initialize as 'free' for non-assigned, 'occupied' for assigned
                    status[slotKey] = slot.assigned ? 'occupied' : 'free';
                    changed = true;
                    console.log(`Initialized ${slotKey}: ${status[slotKey]}`);
                }
            });
        });

        if (changed) {
            console.log('Status changed during initialization, saving...');
            saveStatus(status);
        } else {
            console.log('No changes needed during initialization');
        }
        
        // Initial render after initialization
        console.log('Rendering parking slots...');
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
    console.log('toggleSlot called:', floor, slotNumber);
    const slotKey = `${floor}_${slotNumber}`;
    
    getStatus((status) => {
        console.log('getStatus callback, status:', status);
        // Initialize if doesn't exist
        if (status[slotKey] === undefined) {
            status[slotKey] = 'free';
        }
        
        // Handle both old format (string) and new format (object from auth changes)
        let currentStatus = status[slotKey];
        let oldStatus;
        
        // Extract string status from whatever format we have - MUST be a string
        if (typeof currentStatus === 'string') {
            oldStatus = currentStatus;
        } else if (typeof currentStatus === 'object' && currentStatus !== null) {
            // Extract from object
            oldStatus = currentStatus.status;
            if (!oldStatus || typeof oldStatus !== 'string') {
                oldStatus = 'free';
            }
            // Immediately migrate this slot to string format
            status[slotKey] = oldStatus;
            console.log(`Extracted and migrated status from object for ${slotKey}: ${oldStatus}`);
        } else {
            oldStatus = 'free';
            // Fix invalid status
            status[slotKey] = oldStatus;
        }
        
        // Normalize oldStatus to ensure it's valid - MUST be 'free' or 'occupied'
        if (oldStatus !== 'free' && oldStatus !== 'occupied' && oldStatus !== 'assigned') {
            console.warn(`Invalid oldStatus for ${slotKey}: ${oldStatus}, defaulting to free`);
            oldStatus = 'free';
            status[slotKey] = oldStatus;
        }
        
        // Convert 'assigned' to 'occupied' for toggle logic
        if (oldStatus === 'assigned') {
            oldStatus = 'occupied';
        }
        
        console.log(`Current status for ${slotKey}: ${oldStatus} (type: ${typeof currentStatus}, extracted as string: ${typeof oldStatus})`);
        
        // Toggle between free and occupied (assigned slots can also be toggled)
        let newStatus;
        if (oldStatus === 'free') {
            newStatus = 'occupied';
        } else if (oldStatus === 'occupied') {
            // When freed, always become green (free), regardless of original assignment
            newStatus = 'free';
        } else {
            // Fallback
            newStatus = 'free';
        }
        
        console.log(`Toggling ${slotKey}: ${oldStatus} -> ${newStatus}`);
        
        // Always save as string format (revert to original format)
        status[slotKey] = newStatus;
        console.log('Status updated:', slotKey, '=', newStatus);
        
        // Get slot info for analytics
        const processedFloors = processParkingData();
        const slot = processedFloors
            .find(f => f.floor === floor)
            ?.slots.find(s => s.number === slotNumber);
        
        // Track analytics with anonymized name
        const assignedTo = slot?.name ? anonymizeName(slot.name) : null;
        // Ensure we're passing strings, not objects, to analytics
        const oldStatusString = typeof oldStatus === 'string' ? oldStatus : (oldStatus?.status || 'free');
        const newStatusString = typeof newStatus === 'string' ? newStatus : (newStatus?.status || 'free');
        trackEvent('slot_toggled', {
            floor: floor,
            slot_number: slotNumber,
            old_status: oldStatusString,
            new_status: newStatusString,
            is_assigned: slot?.assigned || false,
            assigned_to: assignedTo
        });
        
        saveStatus(status);
        console.log('Status saved, re-rendering...');
        
        // Always render immediately to show the change, even if Firebase is active
        // The real-time listener will update again if needed, but we want instant feedback
        console.log('Rendering immediately for instant feedback');
        renderParking();
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
    const status = getStatus(); // Synchronous version - reads from localStorage
    const slotKey = `${floor}_${slotNumber}`;
    
    // If status exists in storage, use it
    if (status[slotKey] !== undefined && status[slotKey] !== null) {
        // Handle both old format (string) and new format (object from auth changes)
        const slotStatus = status[slotKey];
        
        // Extract string status from whatever format we have
        let extractedStatus;
        if (typeof slotStatus === 'string') {
            extractedStatus = slotStatus;
        } else if (typeof slotStatus === 'object' && slotStatus !== null) {
            // Extract status from object format
            extractedStatus = slotStatus.status;
            // If we found an object, migrate it immediately
            if (extractedStatus && typeof extractedStatus === 'string') {
                // Migrate this slot immediately
                status[slotKey] = extractedStatus;
                // Save the migrated data
                const key = getStorageKey();
                localStorage.setItem(key, JSON.stringify(status));
                // Also save to Firebase if available
                if (typeof database !== 'undefined') {
                    database.ref(`parking/${key}`).set(status).catch((error) => {
                        console.warn('Firebase write error during migration:', error);
                    });
                }
                console.log(`Migrated ${slotKey} during getSlotStatus: ${extractedStatus}`);
                return extractedStatus;
            }
            // If object format but no status property, default based on assignment
            extractedStatus = isAssigned ? 'occupied' : 'free';
            // Migrate it
            status[slotKey] = extractedStatus;
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(status));
            return extractedStatus;
        } else {
            // Invalid type, default based on assignment
            extractedStatus = isAssigned ? 'occupied' : 'free';
            // Fix it
            status[slotKey] = extractedStatus;
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(status));
            return extractedStatus;
        }
        
        // Validate the extracted status
        if (extractedStatus !== 'free' && extractedStatus !== 'occupied' && extractedStatus !== 'assigned') {
            console.warn(`Invalid status value for ${slotKey}: ${extractedStatus}, defaulting`);
            extractedStatus = isAssigned ? 'occupied' : 'free';
            status[slotKey] = extractedStatus;
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(status));
        }
        
        return extractedStatus;
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
    
    // Order: 1, 2, 3, 4, -1, -2, -3, -4
    const floorOrder = [1, 2, 3, 4, -1, -2, -3, -4];
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
    
    // Apply occupied filter if checkbox is checked
    applyOccupiedFilter();
    
    trackEvent('floor_filtered', { floor: selectedFloor });
}

// Hide/show occupied slots based on checkbox
function applyOccupiedFilter() {
    const checkbox = document.getElementById('hideOccupiedCheckbox');
    if (!checkbox) return; // Checkbox not yet available
    
    const hideOccupied = checkbox.checked;
    const allOccupiedSlots = document.querySelectorAll('.parking-slot.occupied');
    
    // Hide/show occupied slots
    allOccupiedSlots.forEach(slot => {
        if (hideOccupied) {
            slot.style.display = 'none';
        } else {
            slot.style.display = 'flex';
        }
    });
    
    // Hide double parking containers if all slots inside are hidden (occupied)
    const doubleParkingGroups = document.querySelectorAll('.double-parking-group');
    doubleParkingGroups.forEach(group => {
        const slotsInGroup = group.querySelectorAll('.parking-slot');
        const hasVisibleSlots = Array.from(slotsInGroup).some(slot => {
            // A slot is visible if it's not occupied OR if we're not hiding occupied
            return !slot.classList.contains('occupied') || !hideOccupied;
        });
        
        if (hideOccupied && !hasVisibleSlots) {
            group.style.display = 'none';
        } else {
            group.style.display = '';
        }
    });
    
    // Hide floor sections that have no visible slots
    const floorSections = document.querySelectorAll('.floor-section');
    floorSections.forEach(section => {
        const allSlotsInFloor = section.querySelectorAll('.parking-slot');
        const hasVisibleSlots = Array.from(allSlotsInFloor).some(slot => {
            // A slot is visible if it's not occupied OR if we're not hiding occupied
            return !slot.classList.contains('occupied') || !hideOccupied;
        });
        
        if (hideOccupied && !hasVisibleSlots) {
            section.style.display = 'none';
        } else {
            // Only show if it wasn't already hidden by floor filter
            const floorNumber = parseInt(section.dataset.floor);
            const activeChip = document.querySelector('.filter-chip.active');
            if (activeChip) {
                const selectedFloor = activeChip.dataset.floor;
                if (selectedFloor === 'all' || parseInt(selectedFloor) === floorNumber) {
                    section.style.display = 'block';
                }
            } else {
                section.style.display = 'block';
            }
        }
    });
    
    trackEvent('occupied_filter_toggled', { hide_occupied: hideOccupied });
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
    // Ensure status is a string
    const statusString = typeof status === 'string' ? status : (status?.status || 'free');
    const badge = document.createElement('div');
    badge.className = 'status-badge';
    badge.textContent = statusString === 'free' ? 'Available' : 'Occupied';
    return badge;
}

// Render parking slot card
function renderParkingSlot(floor, slot, status) {
    // Validate and normalize status
    let normalizedStatus = status;
    if (typeof status !== 'string') {
        console.warn(`Invalid status type for slot ${floor}_${slot.number}:`, typeof status, status);
        normalizedStatus = slot.assigned ? 'occupied' : 'free';
    } else if (status !== 'free' && status !== 'occupied' && status !== 'assigned') {
        console.warn(`Invalid status value for slot ${floor}_${slot.number}:`, status);
        normalizedStatus = slot.assigned ? 'occupied' : 'free';
    }
    
    // Force normalize to ensure it's exactly 'free' or 'occupied'
    if (normalizedStatus === 'assigned') {
        normalizedStatus = 'occupied'; // 'assigned' should be treated as 'occupied' for CSS
    }
    
    // Final validation
    if (normalizedStatus !== 'free' && normalizedStatus !== 'occupied') {
        console.error(`Invalid normalizedStatus for slot ${floor}_${slot.number}: ${normalizedStatus}, forcing to free`);
        normalizedStatus = 'free';
    }
    
    const slotElement = document.createElement('div');
    // Ensure we're setting the class correctly - use classList for reliability
    slotElement.className = 'parking-slot';
    slotElement.classList.add(normalizedStatus);
    
    // Debug: Log the class being set and verify it
    console.log(`Setting class for slot ${floor}_${slot.number}: parking-slot ${normalizedStatus}`);
    console.log(`  - Actual className: ${slotElement.className}`);
    console.log(`  - Has 'free' class: ${slotElement.classList.contains('free')}`);
    console.log(`  - Has 'occupied' class: ${slotElement.classList.contains('occupied')}`);
    
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
    const badge = renderStatusBadge(normalizedStatus);
    contentWrapper.appendChild(badge);
    
    // Name (bottom, if exists)
    if (displayName) {
        const nameElement = document.createElement('div');
        nameElement.className = 'slot-name';
        nameElement.textContent = displayName;
        contentWrapper.appendChild(nameElement);
    } else {
        // Add spacer to maintain consistent height (same as slot-name min-height)
        const spacer = document.createElement('div');
        spacer.style.height = '16px';
        spacer.style.minHeight = '16px';
        spacer.style.flexShrink = '0';
        contentWrapper.appendChild(spacer);
    }
    
    slotElement.appendChild(contentWrapper);
    
    // Make all slots clickable
    slotElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Slot clicked:', floor, slot.number);
        toggleSlot(floor, slot.number);
    });
    
    return slotElement;
}

// Render parking slots
function renderParking() {
    console.log('=== renderParking() called ===');
    const container = document.getElementById('floorsContainer');
    if (!container) {
        console.error('floorsContainer not found!');
        return;
    }
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
            // Floor 2: Simple sort, pairs will be grouped and arranged side by side
            sortedSlots.sort((a, b) => a.number - b.number);
        } else if (floor.floor === -2) {
            // Floor -2: Chronological left to right, doubles on left
            // Row 1: 350 (double), 29, 30
            // Row 2: 351 (double), 31, 308
            const slotMap = new Map(sortedSlots.map(s => [s.number, s]));
            sortedSlots = [
                slotMap.get(350), slotMap.get(29), slotMap.get(30),  // Row 1
                slotMap.get(351), slotMap.get(31), slotMap.get(308)  // Row 2
            ].filter(Boolean);
        } else if (floor.floor === -3) {
            // Floor -3: Custom layout
            // Row 1: 47, 48, (double parking 336)
            // Row 2: 49, 50, (double parking 337)
            // Row 3: 335, 338, 339
            const slotMap = new Map(sortedSlots.map(s => [s.number, s]));
            sortedSlots = [
                slotMap.get(47),  slotMap.get(48),  slotMap.get(336), // Row 1
                slotMap.get(49),  slotMap.get(50),  slotMap.get(337), // Row 2
                slotMap.get(335), slotMap.get(338), slotMap.get(339)  // Row 3
            ].filter(Boolean);
        } else if (floor.floor === -4) {
            // Floor -4: Chronological left to right, doubles on left
            // Row 1: 238 (double), 240, 241
            // Row 2: 239 (double), 242, 243
            const slotMap = new Map(sortedSlots.map(s => [s.number, s]));
            sortedSlots = [
                slotMap.get(238), slotMap.get(240), slotMap.get(241), // Row 1
                slotMap.get(239), slotMap.get(242), slotMap.get(243)  // Row 2
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
        if (floor.floor === 2 || floor.floor === 3 || floor.floor === -2 || floor.floor === -3 || floor.floor === -4) {
            doubleGroups.forEach(group => {
                const container = document.createElement('div');
                container.className = 'double-parking-group';
                
                // Floor 2: span 1 column (all pairs in one row)
                // Other floors: span 2 columns (pairs on left, regular slots on right)
                if (floor.floor === 2) {
                    container.classList.add('double-parking-floor2');
                }
                
                const label = document.createElement('div');
                label.className = 'double-parking-label';
                label.textContent = 'Double Parking';
                container.appendChild(label);
                
                const slotsContainer = document.createElement('div');
                slotsContainer.className = 'double-parking-slots';
                
                group.forEach(slot => {
                    const status = getSlotStatus(floor.floor, slot.number, slot.assigned);
                    console.log(`Rendering slot ${floor.floor}_${slot.number}: status=${status}, assigned=${slot.assigned}`);
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
            console.log(`Rendering slot ${floor.floor}_${slot.number}: status=${status}, assigned=${slot.assigned}`);
            const slotElement = renderParkingSlot(floor.floor, slot, status);
            grid.appendChild(slotElement);
        });

        floorSection.appendChild(grid);
        container.appendChild(floorSection);
    });
    
    // Apply occupied filter after rendering
    applyOccupiedFilter();
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
    // Wait a bit for Firebase to be ready
    setTimeout(() => {
        console.log('Initializing status...');
        initializeStatus();
    }, 200);
    
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
    
    // Set up hide occupied checkbox
    const hideOccupiedCheckbox = document.getElementById('hideOccupiedCheckbox');
    if (hideOccupiedCheckbox) {
        hideOccupiedCheckbox.addEventListener('change', applyOccupiedFilter);
    }
    
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

