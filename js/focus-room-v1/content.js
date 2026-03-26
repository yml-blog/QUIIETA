var ROOM_MODE_LIBRARY = [
    {
        key: 'foggy-start',
        label: 'Foggy start',
        sub: 'unclear edge / low pressure',
        videoSrc: './assets/video/windowlight-at-midnight.mp4',
        audioSrc: './assets/audio/light-rain.mp3',
        audioName: 'Mist-soft audio',
        audioVolume: 0.1,
        stageClass: 'fr1-stage--mode-foggy',
        supportLine: 'Let the edge appear before asking for momentum.',
        roomLine: 'We are only making the task touchable, not complete.',
        presenceLine: 'A quiet distant presence can help the room feel held.',
        returnLine: 'Resume the first live edge. Leave the rest asleep.'
    },
    {
        key: 'low-energy',
        label: 'Low energy',
        sub: 'low lift / warm support',
        videoSrc: './assets/video/the-focus-sanctuary.mp4',
        audioSrc: './assets/audio/rainfall-soft.mp3',
        audioName: 'Warm rain audio',
        audioVolume: 0.11,
        stageClass: 'fr1-stage--mode-low-energy',
        supportLine: 'Trade intensity for contact. Gentle still counts.',
        roomLine: 'Choose the move that asks the least from your body.',
        presenceLine: 'A soft companion cue can lower the effort of returning.',
        returnLine: 'Protect energy by making the re-entry tiny and visible.'
    },
    {
        key: 'steady-work',
        label: 'Steady work',
        sub: 'clear rhythm / settled attention',
        videoSrc: './assets/video/the-library-of-night.mp4',
        audioSrc: './assets/audio/steady-rain.mp3',
        audioName: 'Steady rain audio',
        audioVolume: 0.14,
        stageClass: 'fr1-stage--mode-steady',
        supportLine: 'Stay with one visible action until it loosens.',
        roomLine: 'Less steering. More staying with what is already open.',
        presenceLine: 'A low, lived-in room signal can keep the thread company.',
        returnLine: 'Return to the motion already underway, not the whole plan.'
    },
    {
        key: 'quiet-return',
        label: 'Quiet return',
        sub: 'soft re-entry / no restart drama',
        videoSrc: './assets/video/the-focus-sanctuary.mp4',
        audioSrc: './assets/audio/light-rain.mp3',
        audioName: 'Quiet wash audio',
        audioVolume: 0.09,
        stageClass: 'fr1-stage--mode-quiet-return',
        supportLine: 'You are returning to a thread, not starting from zero.',
        roomLine: 'Lower the pressure and let the room hand the thread back.',
        presenceLine: 'Co-presence works best here as a soft reminder, not a demand.',
        returnLine: 'Leave yourself a visible handhold for later.'
    },
    {
        key: 'after-interruption',
        label: 'After interruption',
        sub: 'regathering / low-pressure reset',
        videoSrc: './assets/video/windowlight-at-midnight.mp4',
        audioSrc: './assets/audio/rainfall-soft.mp3',
        audioName: 'Reset rain audio',
        audioVolume: 0.1,
        stageClass: 'fr1-stage--mode-after-interruption',
        supportLine: 'Rejoin the smallest live edge and let the rest stay quiet.',
        roomLine: 'The task does not need a dramatic restart. It needs a handhold.',
        presenceLine: 'A distant room signal can help future-you feel less alone.',
        returnLine: 'Mark where you stopped so re-entry does not start from confusion.'
    }
];

var EMOTIONAL_STATE_LIBRARY = [
    {
        id: 'no-start',
        label: 'I do not know where to start',
        support: 'We only need the first edge to become visible.',
        returnNote: 'Come back to the first edge, not the whole task.',
        defaultMode: 'foggy-start',
        microPrompts: [
            'Put {quotedStep} in front of you and only identify the first part your hands can touch.',
            'Do not solve {quotedStep}. Just expose the next edge in one sentence.',
            'Open the working surface for {quotedStep} and mark the first place that asks for motion.'
        ]
    },
    {
        id: 'afraid-badly',
        label: 'I am afraid of doing it badly',
        support: 'Make the next move reversible and rough on purpose.',
        returnNote: 'The return does not need to be elegant to count.',
        defaultMode: 'steady-work',
        microPrompts: [
            'Make {quotedStep} smaller: create the roughest version you can revise later.',
            'Touch {quotedStep} without finishing it. Leave one honest imperfect mark.',
            'Start with the least final part of {quotedStep} so quality does not get the first turn.'
        ]
    },
    {
        id: 'mind-noisy',
        label: 'My mind feels noisy',
        support: 'Lower the number of decisions. One move is enough.',
        returnNote: 'Ignore the pile. Resume the one visible edge.',
        defaultMode: 'quiet-return',
        microPrompts: [
            'For {quotedStep}, remove choices: do the most obvious physical action first.',
            'Close the loop around {quotedStep} to one move only. Name it, then do just that.',
            'Touch {quotedStep} in silence for one minute before making any bigger plan.'
        ]
    },
    {
        id: 'low-energy',
        label: 'My energy is low',
        support: 'Use a low-lift move that creates contact before effort.',
        returnNote: 'Future-you needs a tiny doorway, not a push.',
        defaultMode: 'low-energy',
        microPrompts: [
            'Make contact with {quotedStep} in the smallest low-energy way you can.',
            'Open {quotedStep} and do only the easiest visible motion inside it.',
            'Spend ninety seconds on {quotedStep} without asking for pace or quality.'
        ]
    },
    {
        id: 'pulled-away',
        label: 'I got pulled in too many directions',
        support: 'Pick the thread that reduces drag when touched.',
        returnNote: 'Do not reopen every loop. Rejoin one thread.',
        defaultMode: 'after-interruption',
        microPrompts: [
            'Let {quotedStep} win for one minute. Everything else can stay unresolved.',
            'Write down the other loops, then return to the next visible action inside {quotedStep}.',
            'Touch only the part of {quotedStep} that will make the rest feel less scattered.'
        ]
    }
];

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
