var ROOM_MODE_LIBRARY = [
    {
        key: 'foggy-start',
        label: 'Foggy start',
        sub: 'unclear edge / low pressure',
        videoSrc: './assets/video/windowlight-at-midnight.mp4',
        audioSrc: './assets/audio/light-rain.mp3',
        audioName: 'Mist-soft rain',
        audioVolume: 0.1,
        stageClass: 'fr1-stage--mode-foggy',
        supportLine: 'Let the next edge appear.',
        roomLine: 'Make it touchable, not complete.',
        presenceLine: 'A quiet room signal can help.',
        returnLine: 'Leave one visible edge for later.'
    },
    {
        key: 'low-energy',
        label: 'Low energy',
        sub: 'low lift / warm support',
        videoSrc: './assets/video/the-focus-sanctuary.mp4',
        audioSrc: './assets/audio/rainfall-soft.mp3',
        audioName: 'Warm rain',
        audioVolume: 0.11,
        stageClass: 'fr1-stage--mode-low-energy',
        supportLine: 'Choose the lowest-lift move.',
        roomLine: 'Pick the move that asks least.',
        presenceLine: 'A soft companion cue can help.',
        returnLine: 'Leave a tiny doorway for later.'
    },
    {
        key: 'steady-work',
        label: 'Steady work',
        sub: 'clear rhythm / settled attention',
        videoSrc: './assets/video/the-library-of-night.mp4',
        audioSrc: './assets/audio/steady-rain.mp3',
        audioName: 'Steady rain',
        audioVolume: 0.14,
        stageClass: 'fr1-stage--mode-steady',
        supportLine: 'Stay with one visible move.',
        roomLine: 'Less steering. More staying.',
        presenceLine: 'A lived-in room signal can keep the thread company.',
        returnLine: 'Return to the motion already underway.'
    },
    {
        key: 'quiet-return',
        label: 'Quiet return',
        sub: 'soft re-entry / no restart drama',
        videoSrc: './assets/video/the-focus-sanctuary.mp4',
        audioSrc: './assets/audio/light-rain.mp3',
        audioName: 'Quiet wash',
        audioVolume: 0.09,
        stageClass: 'fr1-stage--mode-quiet-return',
        supportLine: 'You are rejoining a thread.',
        roomLine: 'Let the room hand the thread back.',
        presenceLine: 'Co-presence works best as a soft reminder.',
        returnLine: 'Leave yourself one clear handhold.'
    },
    {
        key: 'after-interruption',
        label: 'After interruption',
        sub: 'regathering / low-pressure reset',
        videoSrc: './assets/video/windowlight-at-midnight.mp4',
        audioSrc: './assets/audio/rainfall-soft.mp3',
        audioName: 'Reset rain',
        audioVolume: 0.1,
        stageClass: 'fr1-stage--mode-after-interruption',
        supportLine: 'Rejoin the smallest live edge.',
        roomLine: 'No dramatic restart needed.',
        presenceLine: 'A distant room signal can help.',
        returnLine: 'Mark where you stopped for later.'
    }
];

var EMOTIONAL_STATE_LIBRARY = [
    {
        id: 'no-start',
        label: 'I do not know where to start',
        support: 'We only need the first edge.',
        returnNote: 'Come back to the first edge.',
        defaultMode: 'foggy-start',
        microPrompts: [
            'Put {quotedStep} in view and mark the first part to touch.',
            'Do not solve {quotedStep}. Name the next edge.',
            'Open {quotedStep} and choose the first live piece.'
        ]
    },
    {
        id: 'afraid-badly',
        label: 'I am afraid of doing it badly',
        support: 'Make the next move rough on purpose.',
        returnNote: 'It does not need to be elegant.',
        defaultMode: 'steady-work',
        microPrompts: [
            'Make {quotedStep} rough on purpose.',
            'Leave one imperfect mark in {quotedStep}.',
            'Start with the least final part of {quotedStep}.'
        ]
    },
    {
        id: 'mind-noisy',
        label: 'My mind feels noisy',
        support: 'Lower the decisions. One move is enough.',
        returnNote: 'Ignore the pile. Resume one edge.',
        defaultMode: 'quiet-return',
        microPrompts: [
            'For {quotedStep}, do the most obvious physical move first.',
            'Cut {quotedStep} down to one move.',
            'Stay with {quotedStep} for one quiet minute.'
        ]
    },
    {
        id: 'low-energy',
        label: 'My energy is low',
        support: 'Use the easiest move that creates contact.',
        returnNote: 'Future-you needs a tiny doorway.',
        defaultMode: 'low-energy',
        microPrompts: [
            'Touch {quotedStep} in the easiest way you can.',
            'Open {quotedStep} and do the lightest visible move.',
            'Give {quotedStep} ninety gentle seconds.'
        ]
    },
    {
        id: 'pulled-away',
        label: 'I got pulled in too many directions',
        support: 'Pick the thread that reduces drag.',
        returnNote: 'Do not reopen every loop.',
        defaultMode: 'after-interruption',
        microPrompts: [
            'Let {quotedStep} be the only thread for one minute.',
            'Write down the other loops, then return to {quotedStep}.',
            'Touch the part of {quotedStep} that reduces drag.'
        ]
    }
];

var RESCUE_PROMPT_LIBRARY = {
    smaller: [
        'Make {quotedStep} smaller. Just set it up.',
        'Touch only the first tiny part of {quotedStep}.',
        'Open {quotedStep} and do the easiest visible motion.'
    ],
    'less-final': [
        'Make {quotedStep} less final. Leave a rough pass.',
        'Touch {quotedStep} in a reversible way.',
        'Start {quotedStep} with a note, not a decision.'
    ]
};

var LEGACY_SCENE_TO_MODE = {
    midnight: 'foggy-start',
    sanctuary: 'quiet-return',
    library: 'steady-work'
};

function cloneItem(item) {
    return JSON.parse(JSON.stringify(item));
}

function cleanText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.replace(/\s+/g, ' ').trim();
}

function formatQuotedStep(firstStep) {
    var safeStep = cleanText(firstStep);

    if (!safeStep) {
        return 'the next visible step';
    }

    return '"' + safeStep + '"';
}

function injectStep(template, firstStep) {
    return String(template || '')
        .replace(/\{quotedStep\}/g, formatQuotedStep(firstStep))
        .replace(/\{firstStep\}/g, cleanText(firstStep) || 'the next visible step');
}

export var DEFAULT_ROOM_MODE_KEY = ROOM_MODE_LIBRARY[0].key;

export function getDefaultEmotionalStates() {
    return EMOTIONAL_STATE_LIBRARY.map(cloneItem);
}

export function getRoomModes() {
    return ROOM_MODE_LIBRARY.map(cloneItem);
}

export function getEmotionById(emotionalStates, emotionalStateId) {
    var library = Array.isArray(emotionalStates) && emotionalStates.length
        ? emotionalStates
        : EMOTIONAL_STATE_LIBRARY;
    var match = null;

    library.some(function (item) {
        if (item.id === emotionalStateId) {
            match = item;
            return true;
        }

        return false;
    });

    return match || library[0] || null;
}

export function getModeByKey(roomModeKey) {
    var match = null;

    ROOM_MODE_LIBRARY.some(function (item) {
        if (item.key === roomModeKey) {
            match = item;
            return true;
        }

        return false;
    });

    return match || ROOM_MODE_LIBRARY[0];
}

export function mapLegacySceneToMode(sceneKey) {
    return LEGACY_SCENE_TO_MODE[sceneKey] || DEFAULT_ROOM_MODE_KEY;
}

export function getSuggestedRoomMode(emotionalStates, emotionalStateId) {
    var emotion = getEmotionById(emotionalStates, emotionalStateId);

    return emotion && emotion.defaultMode ? emotion.defaultMode : DEFAULT_ROOM_MODE_KEY;
}

export function getMicroPromptCount(emotionalStates, emotionalStateId) {
    var emotion = getEmotionById(emotionalStates, emotionalStateId);

    if (!emotion || !Array.isArray(emotion.microPrompts) || !emotion.microPrompts.length) {
        return 1;
    }

    return emotion.microPrompts.length;
}

export function createMicroPrompt(emotionalStates, emotionalStateId, firstStep, variant) {
    var emotion = getEmotionById(emotionalStates, emotionalStateId);
    var prompts = emotion && Array.isArray(emotion.microPrompts) && emotion.microPrompts.length
        ? emotion.microPrompts
        : ['Touch {quotedStep} in the smallest visible way.'];
    var safeVariant = Math.abs(Number(variant || 0)) % prompts.length;

    return injectStep(prompts[safeVariant], firstStep);
}

export function getNextMicroPromptVariant(emotionalStates, emotionalStateId, variant) {
    var promptCount = getMicroPromptCount(emotionalStates, emotionalStateId);
    var current = Math.abs(Number(variant || 0)) % promptCount;

    return (current + 1) % promptCount;
}

export function createRescueMicroPrompt(firstStep, rescueType, variant) {
    var prompts = RESCUE_PROMPT_LIBRARY[rescueType] || RESCUE_PROMPT_LIBRARY.smaller;
    var safeVariant = Math.abs(Number(variant || 0)) % prompts.length;

    return injectStep(prompts[safeVariant], firstStep);
}
