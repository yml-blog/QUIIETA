import { DEFAULT_ROOM_MODE_KEY, mapLegacySceneToMode } from './content.js';

export var FOCUS_ROOM_V2_STORAGE_KEY = 'quieta.focus-room.v2.state';
export var FOCUS_ROOM_V1_STORAGE_KEY = 'quieta.focus-room.v1.state';

var KNOWN_SCREENS = {
    threshold: true,
    'first-step': true,
    'pre-flight': true,
    room: true,
    resume: true
};

var KNOWN_PRE_FLIGHT_STEPS = {
    emotion: true,
    'micro-prompt': true
};

var KNOWN_RESUME_REASONS = {
    'leave-plan': true,
    'soft-finish': true,
    'return-after-interruption': true
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

function normalizeVariant(value) {
    var numeric = Number(value);

    return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : 0;
}

function normalizeScreen(value) {
    if (value === 'friction-check') {
        return 'pre-flight';
    }

    return KNOWN_SCREENS[value] ? value : 'threshold';
}

function normalizeRoomMode(value, legacySceneKey) {
    var normalized = clampString(value, 80);

    if (normalized) {
        return normalized;
    }

    if (legacySceneKey) {
        return mapLegacySceneToMode(legacySceneKey);
    }

    return DEFAULT_ROOM_MODE_KEY;
}

function normalizePreFlightStep(value) {
    var normalized = clampString(value, 40);

    return KNOWN_PRE_FLIGHT_STEPS[normalized] ? normalized : 'emotion';
}

function normalizeResumeReason(value) {
    var normalized = clampString(value, 80);

    return KNOWN_RESUME_REASONS[normalized] ? normalized : 'leave-plan';
}

function sanitizeResumeSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
        return null;
    }

    return {
        firstStep: clampString(snapshot.firstStep, 220),
        emotionalState: clampString(snapshot.emotionalState, 80),
        emotionalLabel: clampString(snapshot.emotionalLabel || snapshot.frictionLabel, 120),
        microPrompt: clampString(snapshot.microPrompt, 260),
        whereIStopped: clampString(snapshot.whereIStopped, 220),
        nextVisibleAction: clampString(snapshot.nextVisibleAction, 220),
        dontForget: clampString(snapshot.dontForget || snapshot.frictionSupport, 220),
        roomMode: normalizeRoomMode(snapshot.roomMode, snapshot.sceneKey),
        roomModeLabel: clampString(snapshot.roomModeLabel || snapshot.sceneLabel, 120),
        presenceMode: !!snapshot.presenceMode,
        updatedAt: normalizeTimestamp(snapshot.updatedAt),
        softStartStartedAt: normalizeTimestamp(snapshot.softStartStartedAt)
    };
}

function readStorageValue(storageKey) {
    try {
        return window.localStorage.getItem(storageKey) || '';
    } catch (error) {
        return '';
    }
}

export function loadStoredFlowState() {
    var raw = readStorageValue(FOCUS_ROOM_V2_STORAGE_KEY) || readStorageValue(FOCUS_ROOM_V1_STORAGE_KEY);
    var parsed = null;
    var legacySceneKey = '';

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

    legacySceneKey = clampString(parsed.sceneKey, 80);

    return {
        screen: normalizeScreen(parsed.screen),
        firstStep: clampString(parsed.firstStep, 220),
        emotionalState: clampString(parsed.emotionalState || parsed.selectedFrictionId, 80),
        microPrompt: clampString(parsed.microPrompt, 260),
        microPromptVariant: normalizeVariant(parsed.microPromptVariant),
        preFlightStep: normalizePreFlightStep(parsed.preFlightStep),
        whereIStopped: clampString(parsed.whereIStopped, 220),
        nextVisibleAction: clampString(parsed.nextVisibleAction, 220),
        dontForget: clampString(parsed.dontForget, 220),
        roomMode: normalizeRoomMode(parsed.roomMode, legacySceneKey),
        presenceMode: !!parsed.presenceMode,
        audioEnabled: !!parsed.audioEnabled,
        roomEnteredAt: normalizeTimestamp(parsed.roomEnteredAt),
        softStartStartedAt: normalizeTimestamp(parsed.softStartStartedAt),
        lastRoomEventAt: normalizeTimestamp(parsed.lastRoomEventAt),
        resumeReason: normalizeResumeReason(parsed.resumeReason),
        resumeSnapshot: sanitizeResumeSnapshot(parsed.resumeSnapshot)
    };
}

export function saveStoredFlowState(payload) {
    try {
        window.localStorage.setItem(FOCUS_ROOM_V2_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        return false;
    }

    return true;
}

export function clearStoredFlowState() {
    try {
        window.localStorage.removeItem(FOCUS_ROOM_V2_STORAGE_KEY);
        window.localStorage.removeItem(FOCUS_ROOM_V1_STORAGE_KEY);
    } catch (error) {
        return false;
    }

    return true;
}
