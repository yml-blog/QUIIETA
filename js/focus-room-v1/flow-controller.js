import { loadStoredFlowState, saveStoredFlowState, clearStoredFlowState } from './storage.js';
import { renderThresholdScreen, bindThresholdScreen } from './screens/threshold-screen.js';
import { renderFirstStepScreen, bindFirstStepScreen } from './screens/first-step-screen.js';
import { renderFrictionCheckScreen, bindFrictionCheckScreen } from './screens/friction-check-screen.js';
import { renderRoomScreen, bindRoomScreen, updateRoomScreen } from './screens/room-screen.js';
import { renderResumeScreen, bindResumeScreen } from './screens/resume-screen.js';

var SOFT_START_DURATION_MS = 2 * 60 * 1000;
var DEFAULT_PROMPTS = [
    {
        id: 'foggy-start',
        label: 'Starting feels foggy',
        support: 'Shrink the return into one visible motion.'
    },
    {
        id: 'too-many-tabs',
        label: 'Too many open loops',
        support: 'Choose the next thing that can be clarified, not the whole pile.'
    },
    {
        id: 'low-energy',
        label: 'My energy is low',
        support: 'Let the first two minutes stay gentle. Presence matters more than pace.'
    },
    {
        id: 'afraid-of-quality',
        label: 'I am bracing for quality',
        support: 'Use the room to continue, not to prove anything.'
    }
];

var ROOM_SCENES = [
    {
        key: 'midnight',
        label: 'Windowlight at Midnight',
        sub: 'rain-lit glass / warm desk light',
        videoSrc: './assets/video/windowlight-at-midnight.mp4',
        audioSrc: './assets/audio/light-rain.mp3'
    },
    {
        key: 'sanctuary',
        label: 'Focus Sanctuary',
        sub: 'protected interior / slow quiet rain',
        videoSrc: './assets/video/the-focus-sanctuary.mp4',
        audioSrc: './assets/audio/rainfall-soft.mp3'
    },
    {
        key: 'library',
        label: 'Library of Night',
        sub: 'quiet archive / deeper shadow',
        videoSrc: './assets/video/the-library-of-night.mp4',
        audioSrc: './assets/audio/steady-rain.mp3'
    }
];

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getSceneByKey(sceneKey) {
    var match = null;

    ROOM_SCENES.some(function (scene) {
        if (scene.key === sceneKey) {
            match = scene;
            return true;
        }

        return false;
    });

    return match || ROOM_SCENES[0];
}

function getPromptById(prompts, promptId) {
    var match = null;

    prompts.some(function (prompt) {
        if (prompt.id === promptId) {
            match = prompt;
            return true;
        }

        return false;
    });

    return match || null;
}

function formatRelativeTime(timestamp) {
    var deltaMs = Date.now() - Number(timestamp || 0);
    var deltaMinutes = Math.max(0, Math.round(deltaMs / 60000));

    if (deltaMinutes <= 1) {
        return 'A moment ago';
    }

    if (deltaMinutes < 60) {
        return deltaMinutes + ' minutes ago';
    }

    return Math.max(1, Math.round(deltaMinutes / 60)) + ' hours ago';
}

function getSoftStartProgress(softStartStartedAt) {
    if (!softStartStartedAt) {
        return 0;
    }

    return clamp((Date.now() - softStartStartedAt) / SOFT_START_DURATION_MS, 0, 1);
}

function createResumeSnapshot(state) {
    var scene = getSceneByKey(state.sceneKey);
    var prompt = getPromptById(state.prompts, state.selectedFrictionId);

    return {
        firstStep: state.firstStep || 'Return to one visible next step.',
        frictionLabel: prompt ? prompt.label : 'Return gently',
        frictionSupport: prompt ? prompt.support : 'The room can hold a smaller restart.',
        sceneLabel: scene.label,
        updatedAt: Date.now(),
        softStartStartedAt: state.softStartStartedAt || 0
    };
}

function createStorageSnapshot(state) {
    return {
        screen: state.screen,
        firstStep: state.firstStep,
        selectedFrictionId: state.selectedFrictionId,
        sceneKey: state.sceneKey,
        audioEnabled: state.audioEnabled,
        roomEnteredAt: state.roomEnteredAt,
        softStartStartedAt: state.softStartStartedAt,
        lastRoomEventAt: state.lastRoomEventAt,
        resumeSnapshot: state.resumeSnapshot
    };
}

function createDefaultState(prompts) {
    return {
        screen: 'threshold',
        prompts: prompts,
        firstStep: '',
        selectedFrictionId: '',
        sceneKey: ROOM_SCENES[0].key,
        audioEnabled: false,
        roomEnteredAt: 0,
        softStartStartedAt: 0,
        lastRoomEventAt: 0,
        resumeSnapshot: null
    };
}

function normalizePrompts(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.prompts)) {
        return DEFAULT_PROMPTS.slice();
    }

    var normalized = payload.prompts.reduce(function (list, prompt) {
        if (!prompt || typeof prompt !== 'object') {
            return list;
        }

        var id = typeof prompt.id === 'string' ? prompt.id.trim() : '';
        var label = typeof prompt.label === 'string' ? prompt.label.trim() : '';
        var support = typeof prompt.support === 'string' ? prompt.support.trim() : '';

        if (!id || !label || !support) {
            return list;
        }

        list.push({
            id: id,
            label: label,
            support: support
        });

        return list;
    }, []);

    return normalized.length ? normalized : DEFAULT_PROMPTS.slice();
}

async function loadPromptLibrary(url) {
    if (!url) {
        return DEFAULT_PROMPTS.slice();
    }

    if (typeof window.fetch !== 'function') {
        return DEFAULT_PROMPTS.slice();
    }

    try {
        var response = await window.fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load prompts');
        }

        return normalizePrompts(await response.json());
    } catch (error) {
        return DEFAULT_PROMPTS.slice();
    }
}

function buildDerivedState(state) {
    var scene = getSceneByKey(state.sceneKey);
    var selectedPrompt = getPromptById(state.prompts, state.selectedFrictionId);
    var softStartProgress = getSoftStartProgress(state.softStartStartedAt);
    var softStartSettled = softStartProgress >= 1;
    var resumeSnapshot = state.resumeSnapshot || createResumeSnapshot(state);

    return {
        scene: scene,
        selectedPrompt: selectedPrompt,
        scenes: ROOM_SCENES.slice(),
        softStart: {
            progress: softStartProgress,
            settled: softStartSettled,
            title: softStartSettled ? 'Room settled' : 'Soft start underway',
            body: softStartSettled
                ? 'Stay with the next visible step. Nothing else needs to be optimized yet.'
                : 'The first two minutes stay deliberately gentle. No pushing, just returning.',
            detail: softStartSettled ? 'You are past the quiet landing.' : 'A quiet 2-minute landing is holding the room.'
        },
        audioLabel: state.audioEnabled ? 'Quiet audio on' : 'Quiet audio off',
        resume: {
            firstStep: resumeSnapshot.firstStep,
            frictionLabel: resumeSnapshot.frictionLabel,
            frictionSupport: resumeSnapshot.frictionSupport,
            sceneLabel: resumeSnapshot.sceneLabel,
            updatedText: resumeSnapshot.updatedAt ? formatRelativeTime(resumeSnapshot.updatedAt) : 'Ready to return'
        }
    };
}

function mergeStoredState(prompts, storedState) {
    var base = createDefaultState(prompts);

    if (!storedState) {
        return base;
    }

    base.screen = storedState.screen || base.screen;
    base.firstStep = storedState.firstStep || base.firstStep;
    base.selectedFrictionId = storedState.selectedFrictionId || base.selectedFrictionId;
    base.sceneKey = storedState.sceneKey || base.sceneKey;
    base.audioEnabled = !!storedState.audioEnabled;
    base.roomEnteredAt = storedState.roomEnteredAt || 0;
    base.softStartStartedAt = storedState.softStartStartedAt || 0;
    base.lastRoomEventAt = storedState.lastRoomEventAt || 0;
    base.resumeSnapshot = storedState.resumeSnapshot || null;

    if ((base.screen === 'room' || base.screen === 'resume') && base.resumeSnapshot) {
        base.screen = 'resume';
    }

    return base;
}

function FocusRoomV1Controller(config) {
    this.root = config.root;
    this.state = config.state;
    this.cleanupScreen = null;
    this.roomTicker = 0;
    this.ambientAudio = typeof window.Audio === 'function' ? new window.Audio() : null;
    this.currentAudioSrc = '';

    if (this.ambientAudio) {
        this.ambientAudio.loop = true;
        this.ambientAudio.preload = 'auto';
        this.ambientAudio.volume = 0.14;
    }
}

FocusRoomV1Controller.prototype.getContext = function () {
    return {
        state: this.state,
        derived: buildDerivedState(this.state)
    };
};

FocusRoomV1Controller.prototype.persist = function () {
    saveStoredFlowState(createStorageSnapshot(this.state));
};

FocusRoomV1Controller.prototype.updateState = function (patch, options) {
    var config = options || {};

    this.state = Object.assign({}, this.state, patch);

    if (config.persist !== false) {
        this.persist();
    }

    if (config.render !== false) {
        this.render();
        return;
    }

    if (this.state.screen === 'room') {
        this.syncAmbientAudio();
        this.updateRoomLiveState();
    }
};

FocusRoomV1Controller.prototype.resetFlow = function () {
    var prompts = this.state.prompts.slice();

    this.stopRoomTicker();
    this.pauseAmbientAudio();
    clearStoredFlowState();
    this.state = createDefaultState(prompts);
    this.render();
};

FocusRoomV1Controller.prototype.pauseAmbientAudio = function () {
    if (!this.ambientAudio) {
        return;
    }

    this.ambientAudio.pause();
};

FocusRoomV1Controller.prototype.syncAmbientAudio = function () {
    var scene = null;
    var playRequest = null;

    if (!this.ambientAudio) {
        return;
    }

    if (this.state.screen !== 'room' || !this.state.audioEnabled) {
        this.pauseAmbientAudio();
        return;
    }

    scene = getSceneByKey(this.state.sceneKey);

    if (this.currentAudioSrc !== scene.audioSrc) {
        this.currentAudioSrc = scene.audioSrc;
        this.ambientAudio.src = scene.audioSrc;
    }

    playRequest = this.ambientAudio.play();

    if (playRequest && typeof playRequest.catch === 'function') {
        playRequest.catch(function () {
            return null;
        });
    }
};

FocusRoomV1Controller.prototype.startRoomTicker = function () {
    var controller = this;

    this.stopRoomTicker();

    if (this.state.screen !== 'room') {
        return;
    }

    this.updateRoomLiveState();
    this.roomTicker = window.setInterval(function () {
        controller.updateRoomLiveState();
    }, 1000);
};

FocusRoomV1Controller.prototype.stopRoomTicker = function () {
    if (!this.roomTicker) {
        return;
    }

    window.clearInterval(this.roomTicker);
    this.roomTicker = 0;
};

FocusRoomV1Controller.prototype.updateRoomLiveState = function () {
    if (this.state.screen !== 'room') {
        return;
    }

    updateRoomScreen(this.root, this.getContext());
};

FocusRoomV1Controller.prototype.createActions = function () {
    var controller = this;

    return {
        completeThreshold: function () {
            controller.updateState({
                screen: 'first-step'
            });
        },
        backToThreshold: function () {
            controller.updateState({
                screen: 'threshold'
            });
        },
        submitFirstStep: function (value) {
            var nextValue = typeof value === 'string' ? value.trim().slice(0, 220) : '';

            if (!nextValue) {
                return;
            }

            controller.updateState({
                screen: 'friction-check',
                firstStep: nextValue
            });
        },
        backToFirstStep: function () {
            controller.updateState({
                screen: 'first-step'
            });
        },
        selectFriction: function (promptId) {
            controller.updateState({
                selectedFrictionId: promptId
            });
        },
        enterRoom: function () {
            var startedAt = controller.state.softStartStartedAt || Date.now();
            var snapshot = createResumeSnapshot(Object.assign({}, controller.state, {
                softStartStartedAt: startedAt
            }));

            controller.updateState({
                screen: 'room',
                roomEnteredAt: controller.state.roomEnteredAt || Date.now(),
                softStartStartedAt: startedAt,
                lastRoomEventAt: Date.now(),
                resumeSnapshot: snapshot
            });
        },
        changeScene: function (sceneKey) {
            var snapshot = createResumeSnapshot(Object.assign({}, controller.state, {
                sceneKey: sceneKey
            }));

            controller.updateState({
                sceneKey: sceneKey,
                resumeSnapshot: snapshot
            });
        },
        toggleAudio: function () {
            controller.updateState({
                audioEnabled: !controller.state.audioEnabled
            });
        },
        markInterrupted: function () {
            controller.updateState({
                screen: 'resume',
                lastRoomEventAt: Date.now(),
                resumeSnapshot: createResumeSnapshot(controller.state)
            });
        },
        returnToRoom: function () {
            controller.updateState({
                screen: 'room',
                lastRoomEventAt: Date.now()
            });
        },
        finishSoftly: function () {
            controller.resetFlow();
        },
        startOver: function () {
            controller.resetFlow();
        }
    };
};

FocusRoomV1Controller.prototype.render = function () {
    var context = this.getContext();
    var actions = this.createActions();
    var markup = '';

    if (this.cleanupScreen) {
        this.cleanupScreen();
        this.cleanupScreen = null;
    }

    this.stopRoomTicker();

    if (this.state.screen === 'threshold') {
        markup = renderThresholdScreen(context);
        this.root.innerHTML = markup;
        this.cleanupScreen = bindThresholdScreen(this.root, context, actions);
        this.pauseAmbientAudio();
        return;
    }

    if (this.state.screen === 'first-step') {
        markup = renderFirstStepScreen(context);
        this.root.innerHTML = markup;
        this.cleanupScreen = bindFirstStepScreen(this.root, context, actions);
        this.pauseAmbientAudio();
        return;
    }

    if (this.state.screen === 'friction-check') {
        markup = renderFrictionCheckScreen(context);
        this.root.innerHTML = markup;
        this.cleanupScreen = bindFrictionCheckScreen(this.root, context, actions);
        this.pauseAmbientAudio();
        return;
    }

    if (this.state.screen === 'room') {
        markup = renderRoomScreen(context);
        this.root.innerHTML = markup;
        this.cleanupScreen = bindRoomScreen(this.root, context, actions);
        this.syncAmbientAudio();
        this.startRoomTicker();
        return;
    }

    markup = renderResumeScreen(context);
    this.root.innerHTML = markup;
    this.cleanupScreen = bindResumeScreen(this.root, context, actions);
    this.pauseAmbientAudio();
};

export async function createFocusRoomV1App(config) {
    var prompts = await loadPromptLibrary(config.promptsUrl);
    var storedState = loadStoredFlowState();
    var controller = new FocusRoomV1Controller({
        root: config.root,
        state: mergeStoredState(prompts, storedState)
    });

    controller.render();
    controller.persist();
    return controller;
}
