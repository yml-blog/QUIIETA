export var FOCUS_ROOM_V1_STORAGE_KEY = 'quieta.focus-room.v1.state';

var KNOWN_SCREENS = {
    threshold: true,
    'first-step': true,
    'friction-check': true,
    room: true,
    resume: true
};

function clampString(value, maxLength) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().slice(0, maxLength);
}

function normalizeTimestamp(value) {
    var numeric = Number(value);

    return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 0;
}

function sanitizeResumeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return null;
    }

    return {
        firstStep: clampString(snapshot.firstStep, 220),
        frictionLabel: clampString(snapshot.frictionLabel, 120),
        frictionSupport: clampString(snapshot.frictionSupport, 220),
        sceneLabel: clampString(snapshot.sceneLabel, 120),
        updatedAt: normalizeTimestamp(snapshot.updatedAt),
        softStartStartedAt: normalizeTimestamp(snapshot.softStartStartedAt)
    };
}

export function loadStoredFlowState() {
    var raw = '';
    var parsed = null;

    try {
        raw = window.localStorage.getItem(FOCUS_ROOM_V1_STORAGE_KEY) || '';
    } catch (error) {
        return null;
    }

    if (!raw) {
        return null;
    }

    try {
        parsed = JSON.parse(raw);
    } catch (error) {
        return null;
    }

    if (!parsed || typeof parsed !== 'object') {
        return null;
    }

    return {
        screen: KNOWN_SCREENS[parsed.screen] ? parsed.screen : 'threshold',
        firstStep: clampString(parsed.firstStep, 220),
        selectedFrictionId: clampString(parsed.selectedFrictionId, 80),
        sceneKey: clampString(parsed.sceneKey, 80) || 'midnight',
        audioEnabled: !!parsed.audioEnabled,
        roomEnteredAt: normalizeTimestamp(parsed.roomEnteredAt),
        softStartStartedAt: normalizeTimestamp(parsed.softStartStartedAt),
        lastRoomEventAt: normalizeTimestamp(parsed.lastRoomEventAt),
        resumeSnapshot: sanitizeResumeSnapshot(parsed.resumeSnapshot)
    };
}

export function saveStoredFlowState(payload) {
    try {
        window.localStorage.setItem(FOCUS_ROOM_V1_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        return false;
    }

    return true;
}

export function clearStoredFlowState() {
    try {
        window.localStorage.removeItem(FOCUS_ROOM_V1_STORAGE_KEY);
    } catch (error) {
        return false;
    }

    return true;
}
