import { loadStoredFlowState, saveStoredFlowState, clearStoredFlowState } from './storage.js';
import {
    DEFAULT_ROOM_MODE_KEY,
    createMicroPrompt,
    createRescueMicroPrompt,
    getDefaultEmotionalStates,
    getEmotionById,
    getModeByKey,
    getNextMicroPromptVariant,
    getRoomModes,
    getSuggestedRoomMode
} from './content.js';
import { renderThresholdScreen, bindThresholdScreen } from './screens/threshold-screen.js';
import { renderFirstStepScreen, bindFirstStepScreen } from './screens/first-step-screen.js';
import { renderFrictionCheckScreen, bindFrictionCheckScreen } from './screens/friction-check-screen.js';
import { renderRoomScreen, bindRoomScreen, updateRoomScreen } from './screens/room-screen.js';
import { renderResumeScreen, bindResumeScreen } from './screens/resume-screen.js';

var SOFT_START_DURATION_MS = 90 * 1000;
var VISIBILITY_INTERRUPTION_MS = 45 * 1000;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function clampText(value, maxLength) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().slice(0, maxLength);
}

function getSelectedEmotion(state) {
    if (!state.emotionalState) {
        return null;
    }

    return getEmotionById(state.emotionalStates, state.emotionalState);
}

function getSafePreFlightStep(preFlightStep, emotionalState) {
    if (preFlightStep === 'micro-prompt' && emotionalState) {
        return 'micro-prompt';
    }

    return 'emotion';
}

function getSafeResumeReason(resumeReason) {
    if (
        resumeReason === 'soft-finish' ||
        resumeReason === 'return-after-interruption' ||
        resumeReason === 'leave-plan'
    ) {
        return resumeReason;
    }

    return 'leave-plan';
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

function getEffectiveMicroPrompt(state) {
    if (!state.emotionalState) {
        return '';
    }

    return state.microPrompt || createMicroPrompt(
        state.emotionalStates,
        state.emotionalState,
        state.firstStep,
        state.microPromptVariant
    );
}

function buildDefaultResumePlan(state) {
    var emotion = getSelectedEmotion(state);
    var mode = getModeByKey(state.roomMode);
    var microPrompt = getEffectiveMicroPrompt(state);

    return {
        whereIStopped: state.whereIStopped || state.firstStep || microPrompt,
        nextVisibleAction: state.nextVisibleAction || microPrompt || state.firstStep,
        dontForget: state.dontForget || (emotion ? emotion.returnNote : mode.returnLine)
    };
}

function createResumeSnapshot(state) {
    var emotion = getSelectedEmotion(state);
    var mode = getModeByKey(state.roomMode);
    var resumePlan = buildDefaultResumePlan(state);
    var microPrompt = getEffectiveMicroPrompt(state);

    return {
        firstStep: state.firstStep || 'Return to one visible edge.',
        emotionalState: state.emotionalState || '',
        emotionalLabel: emotion ? emotion.label : 'Gentle return',
        microPrompt: microPrompt || state.firstStep || 'Touch the next visible edge.',
        whereIStopped: resumePlan.whereIStopped || 'At the edge of starting.',
        nextVisibleAction: resumePlan.nextVisibleAction || microPrompt || state.firstStep || 'Touch the next visible edge.',
        dontForget: resumePlan.dontForget || mode.returnLine,
        roomMode: state.roomMode || DEFAULT_ROOM_MODE_KEY,
        roomModeLabel: mode.label,
        presenceMode: !!state.presenceMode,
        updatedAt: Date.now(),
        softStartStartedAt: state.softStartStartedAt || 0
    };
}

function createStorageSnapshot(state) {
    return {
        screen: state.screen,
        firstStep: state.firstStep,
        emotionalState: state.emotionalState,
        microPrompt: state.microPrompt,
        microPromptVariant: state.microPromptVariant,
        preFlightStep: state.preFlightStep,
        whereIStopped: state.whereIStopped,
        nextVisibleAction: state.nextVisibleAction,
        dontForget: state.dontForget,
        roomMode: state.roomMode,
        presenceMode: state.presenceMode,
        audioEnabled: state.audioEnabled,
        roomEnteredAt: state.roomEnteredAt,
        softStartStartedAt: state.softStartStartedAt,
        lastRoomEventAt: state.lastRoomEventAt,
        resumeReason: state.resumeReason,
        resumeSnapshot: state.resumeSnapshot
    };
}

function createDefaultState(emotionalStates) {
    return {
        screen: 'threshold',
        emotionalStates: emotionalStates,
        firstStep: '',
        emotionalState: '',
        microPrompt: '',
        microPromptVariant: 0,
        preFlightStep: 'emotion',
        whereIStopped: '',
        nextVisibleAction: '',
        dontForget: '',
        roomMode: DEFAULT_ROOM_MODE_KEY,
        presenceMode: false,
        audioEnabled: false,
        roomEnteredAt: 0,
        softStartStartedAt: 0,
        lastRoomEventAt: 0,
        resumeReason: 'leave-plan',
        resumeSnapshot: null
    };
}

function normalizeEmotionalStates(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.emotionalStates)) {
        return getDefaultEmotionalStates();
    }

    return payload.emotionalStates.reduce(function (list, item) {
        if (!item || typeof item !== 'object') {
            return list;
        }

        if (
            typeof item.id !== 'string' ||
            typeof item.label !== 'string' ||
            typeof item.support !== 'string' ||
            typeof item.returnNote !== 'string' ||
            typeof item.defaultMode !== 'string' ||
            !Array.isArray(item.microPrompts) ||
            !item.microPrompts.length
        ) {
            return list;
        }

        list.push({
            id: item.id.trim(),
            label: item.label.trim(),
            support: item.support.trim(),
            returnNote: item.returnNote.trim(),
            defaultMode: item.defaultMode.trim(),
            microPrompts: item.microPrompts.map(function (microPrompt) {
                return clampText(microPrompt, 220);
            }).filter(Boolean)
        });

        return list;
    }, []).filter(function (item) {
        return item.id && item.label && item.support && item.returnNote && item.defaultMode && item.microPrompts.length;
    });
}

async function loadEmotionalLibrary(url) {
    if (!url || typeof window.fetch !== 'function') {
        return getDefaultEmotionalStates();
    }

    try {
        var response = await window.fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load emotional states');
        }

        return normalizeEmotionalStates(await response.json());
    } catch (error) {
        return getDefaultEmotionalStates();
    }
}

function buildDerivedState(state) {
    var mode = getModeByKey(state.roomMode);
    var emotion = getSelectedEmotion(state);
    var softStartProgress = getSoftStartProgress(state.softStartStartedAt);
    var softStartSettled = softStartProgress >= 1;
    var microPrompt = getEffectiveMicroPrompt(state);
    var resumePlan = buildDefaultResumePlan(state);
    var resumeSnapshot = state.resumeSnapshot || createResumeSnapshot(state);
    var nextAction = state.nextVisibleAction || microPrompt || state.firstStep || 'Touch the next visible edge.';

    return {
        scene: mode,
        roomModes: getRoomModes(),
        selectedEmotion: emotion,
        nextAction: nextAction,
        microPrompt: microPrompt || 'Touch the next visible edge.',
        supportLine: mode.supportLine,
        anchorLine: state.firstStep || 'Make the first move visible.',
        audioLabel: state.audioEnabled ? 'Sound on' : 'Sound off',
        audioName: mode.audioName,
        presence: {
            enabled: !!state.presenceMode,
            label: state.presenceMode ? 'On' : 'Off',
            detail: state.presenceMode
                ? mode.presenceLine
                : 'Leave it off for a quieter room.'
        },
        softStart: {
            progress: softStartProgress,
            settled: softStartSettled,
            title: softStartSettled ? 'Soft start settled' : 'Soft start underway',
            body: softStartSettled
                ? 'You are past the first landing. Stay with one visible action.'
                : 'The first ninety seconds stay deliberately gentle. Contact matters more than pace.',
            detail: softStartSettled
                ? 'You can let the room recede now.'
                : 'Keep the task small enough to touch without bracing.'
        },
        resume: {
            firstStep: resumeSnapshot.firstStep || state.firstStep || 'Return to one visible edge.',
            emotionalLabel: resumeSnapshot.emotionalLabel || (emotion ? emotion.label : 'Gentle return'),
            microPrompt: resumeSnapshot.microPrompt || microPrompt || state.firstStep || 'Touch the next visible edge.',
            whereIStopped: resumeSnapshot.whereIStopped || resumePlan.whereIStopped || 'Not marked yet',
            nextVisibleAction: resumeSnapshot.nextVisibleAction || resumePlan.nextVisibleAction || nextAction,
            dontForget: resumeSnapshot.dontForget || resumePlan.dontForget || mode.returnLine,
            roomModeLabel: resumeSnapshot.roomModeLabel || mode.label,
            presenceLabel: resumeSnapshot.presenceMode ? 'Co-presence on' : 'Co-presence off',
            updatedText: resumeSnapshot.updatedAt ? formatRelativeTime(resumeSnapshot.updatedAt) : 'Ready to return',
            reason: getSafeResumeReason(state.resumeReason),
            needsCapture: !(
                (state.whereIStopped || resumeSnapshot.whereIStopped) &&
                (state.nextVisibleAction || resumeSnapshot.nextVisibleAction) &&
                (state.dontForget || resumeSnapshot.dontForget)
            )
        }
    };
}

function mergeStoredState(emotionalStates, storedState) {
    var base = createDefaultState(emotionalStates);
    var emotion = null;

    if (!storedState) {
        return base;
    }

    base.screen = storedState.screen || base.screen;
    base.firstStep = storedState.firstStep || base.firstStep;
    base.emotionalState = storedState.emotionalState || base.emotionalState;
    base.microPromptVariant = storedState.microPromptVariant || 0;
    base.microPrompt = storedState.microPrompt || base.microPrompt;
    base.preFlightStep = getSafePreFlightStep(storedState.preFlightStep, storedState.emotionalState);
    base.whereIStopped = storedState.whereIStopped || base.whereIStopped;
    base.nextVisibleAction = storedState.nextVisibleAction || base.nextVisibleAction;
    base.dontForget = storedState.dontForget || base.dontForget;
    base.roomMode = storedState.roomMode || base.roomMode;
    base.presenceMode = !!storedState.presenceMode;
    base.audioEnabled = !!storedState.audioEnabled;
    base.roomEnteredAt = storedState.roomEnteredAt || 0;
    base.softStartStartedAt = storedState.softStartStartedAt || 0;
    base.lastRoomEventAt = storedState.lastRoomEventAt || 0;
    base.resumeReason = getSafeResumeReason(storedState.resumeReason);
    base.resumeSnapshot = storedState.resumeSnapshot || null;

    if (base.emotionalState && !base.microPrompt) {
        base.microPrompt = createMicroPrompt(emotionalStates, base.emotionalState, base.firstStep, base.microPromptVariant);
    }

    if (!base.nextVisibleAction) {
        base.nextVisibleAction = base.microPrompt || base.firstStep;
    }

    if (!base.dontForget && base.emotionalState) {
        emotion = getEmotionById(emotionalStates, base.emotionalState);
        base.dontForget = emotion ? emotion.returnNote : base.dontForget;
    }

    if (base.screen === 'room' && base.resumeSnapshot) {
        base.screen = 'resume';
        base.resumeReason = 'return-after-interruption';
    }

    if (base.screen === 'resume') {
        base.resumeReason = getSafeResumeReason(storedState.resumeReason || base.resumeReason);
    }

    return base;
}

function FocusRoomV1Controller(config) {
    this.root = config.root;
    this.emotionalStates = config.emotionalStates;
    this.state = config.state;
    this.cleanupScreen = null;
    this.roomTicker = 0;
    this.ambientAudio = typeof window.Audio === 'function' ? new window.Audio() : null;
    this.currentAudioSrc = '';
    this.hiddenAt = 0;
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    if (this.ambientAudio) {
        this.ambientAudio.loop = true;
        this.ambientAudio.preload = 'auto';
        this.ambientAudio.volume = 0.12;
    }

    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
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
    this.stopRoomTicker();
    this.pauseAmbientAudio();
    this.hiddenAt = 0;
    clearStoredFlowState();
    this.state = createDefaultState(this.emotionalStates);
    this.render();
};

FocusRoomV1Controller.prototype.pauseAmbientAudio = function () {
    if (!this.ambientAudio) {
        return;
    }

    this.ambientAudio.pause();
};

FocusRoomV1Controller.prototype.syncAmbientAudio = function () {
    var mode = getModeByKey(this.state.roomMode);
    var playRequest = null;

    if (!this.ambientAudio) {
        return;
    }

    if (this.state.screen !== 'room' || !this.state.audioEnabled) {
        this.pauseAmbientAudio();
        return;
    }

    if (this.currentAudioSrc !== mode.audioSrc) {
        this.currentAudioSrc = mode.audioSrc;
        this.ambientAudio.src = mode.audioSrc;
    }

    this.ambientAudio.volume = mode.audioVolume;
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

FocusRoomV1Controller.prototype.openResumeScreen = function (reason, options) {
    var config = options || {};
    var resumePlan = buildDefaultResumePlan(this.state);
    var nextState = {
        screen: 'resume',
        resumeReason: getSafeResumeReason(reason),
        lastRoomEventAt: Date.now(),
        roomMode: config.roomMode || this.state.roomMode,
        whereIStopped: resumePlan.whereIStopped,
        nextVisibleAction: resumePlan.nextVisibleAction,
        dontForget: resumePlan.dontForget
    };

    nextState.resumeSnapshot = createResumeSnapshot(Object.assign({}, this.state, nextState));
    this.updateState(nextState, config.updateOptions);
};

FocusRoomV1Controller.prototype.handleVisibilityChange = function () {
    var hiddenFor = 0;

    if (typeof document === 'undefined') {
        return;
    }

    if (document.hidden) {
        if (this.state.screen !== 'room') {
            return;
        }

        this.hiddenAt = Date.now();
        this.updateState({
            lastRoomEventAt: this.hiddenAt,
            resumeSnapshot: createResumeSnapshot(this.state)
        }, {
            render: false
        });
        return;
    }

    if (!this.hiddenAt) {
        return;
    }

    hiddenFor = Date.now() - this.hiddenAt;
    this.hiddenAt = 0;

    if (this.state.screen !== 'room' || hiddenFor < VISIBILITY_INTERRUPTION_MS) {
        return;
    }

    this.openResumeScreen('return-after-interruption', {
        roomMode: 'after-interruption'
    });
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
            var nextValue = clampText(value, 220);
            var nextState = {
                screen: 'pre-flight',
                firstStep: nextValue,
                preFlightStep: 'emotion'
            };

            if (!nextValue) {
                return;
            }

            if (controller.state.emotionalState) {
                nextState.microPromptVariant = 0;
                nextState.microPrompt = createMicroPrompt(
                    controller.state.emotionalStates,
                    controller.state.emotionalState,
                    nextValue,
                    0
                );
                nextState.nextVisibleAction = nextState.microPrompt;
            } else {
                nextState.microPrompt = '';
                nextState.nextVisibleAction = '';
            }

            controller.updateState(nextState);
        },
        backToFirstStep: function () {
            controller.updateState({
                screen: 'first-step',
                preFlightStep: 'emotion'
            });
        },
        selectEmotionalState: function (emotionalStateId) {
            var variant = 0;
            var microPrompt = '';
            var emotion = null;
            var previousEmotion = getSelectedEmotion(controller.state);
            var nextVisibleAction = controller.state.nextVisibleAction;
            var nextDontForget = controller.state.dontForget;

            if (!emotionalStateId) {
                return;
            }

            microPrompt = createMicroPrompt(
                controller.state.emotionalStates,
                emotionalStateId,
                controller.state.firstStep,
                variant
            );
            emotion = getEmotionById(controller.state.emotionalStates, emotionalStateId);

            if (!nextVisibleAction || nextVisibleAction === controller.state.microPrompt) {
                nextVisibleAction = microPrompt;
            }

            if (!nextDontForget || (previousEmotion && nextDontForget === previousEmotion.returnNote)) {
                nextDontForget = emotion ? emotion.returnNote : nextDontForget;
            }

            controller.updateState({
                emotionalState: emotionalStateId,
                microPromptVariant: variant,
                microPrompt: microPrompt,
                nextVisibleAction: nextVisibleAction,
                dontForget: nextDontForget,
                roomMode: getSuggestedRoomMode(controller.state.emotionalStates, emotionalStateId),
                preFlightStep: 'micro-prompt'
            });
        },
        updateMicroPrompt: function (value) {
            var nextValue = clampText(value, 260);
            var nextVisibleAction = controller.state.nextVisibleAction;

            if (!nextVisibleAction || nextVisibleAction === controller.state.microPrompt) {
                nextVisibleAction = nextValue;
            }

            controller.updateState({
                microPrompt: nextValue,
                nextVisibleAction: nextVisibleAction
            }, {
                render: false
            });
        },
        regenerateMicroPrompt: function () {
            var nextVariant = 0;
            var nextMicroPrompt = '';
            var nextVisibleAction = controller.state.nextVisibleAction;

            if (!controller.state.emotionalState) {
                return;
            }

            nextVariant = getNextMicroPromptVariant(
                controller.state.emotionalStates,
                controller.state.emotionalState,
                controller.state.microPromptVariant
            );
            nextMicroPrompt = createMicroPrompt(
                controller.state.emotionalStates,
                controller.state.emotionalState,
                controller.state.firstStep,
                nextVariant
            );

            if (!nextVisibleAction || nextVisibleAction === controller.state.microPrompt) {
                nextVisibleAction = nextMicroPrompt;
            }

            controller.updateState({
                microPromptVariant: nextVariant,
                microPrompt: nextMicroPrompt,
                nextVisibleAction: nextVisibleAction
            });
        },
        enterRoom: function () {
            var startedAt = controller.state.softStartStartedAt || Date.now();
            var emotion = getSelectedEmotion(controller.state);
            var nextState = {
                screen: 'room',
                roomEnteredAt: controller.state.roomEnteredAt || Date.now(),
                softStartStartedAt: startedAt,
                lastRoomEventAt: Date.now(),
                microPrompt: getEffectiveMicroPrompt(controller.state),
                nextVisibleAction: controller.state.nextVisibleAction || getEffectiveMicroPrompt(controller.state) || controller.state.firstStep,
                dontForget: controller.state.dontForget || (emotion ? emotion.returnNote : getModeByKey(controller.state.roomMode).returnLine),
                resumeReason: 'leave-plan'
            };

            nextState.resumeSnapshot = createResumeSnapshot(Object.assign({}, controller.state, nextState));
            controller.updateState(nextState);
        },
        changeRoomMode: function (roomModeKey) {
            var nextState = {
                roomMode: getModeByKey(roomModeKey).key
            };

            nextState.resumeSnapshot = createResumeSnapshot(Object.assign({}, controller.state, nextState));
            controller.updateState(nextState, {
                render: false
            });
        },
        togglePresenceMode: function () {
            var nextState = {
                presenceMode: !controller.state.presenceMode
            };

            nextState.resumeSnapshot = createResumeSnapshot(Object.assign({}, controller.state, nextState));
            controller.updateState(nextState, {
                render: false
            });
        },
        toggleAudio: function () {
            controller.updateState({
                audioEnabled: !controller.state.audioEnabled
            }, {
                render: false
            });
        },
        rewriteMicroPrompt: function (rescueType) {
            var nextVariant = controller.state.microPromptVariant + 1;
            var nextMicroPrompt = createRescueMicroPrompt(
                controller.state.firstStep,
                rescueType,
                nextVariant
            );

            controller.updateState({
                microPrompt: nextMicroPrompt,
                microPromptVariant: nextVariant,
                nextVisibleAction: nextMicroPrompt,
                lastRoomEventAt: Date.now(),
                resumeSnapshot: createResumeSnapshot(Object.assign({}, controller.state, {
                    microPrompt: nextMicroPrompt,
                    microPromptVariant: nextVariant,
                    nextVisibleAction: nextMicroPrompt
                }))
            }, {
                render: false
            });
        },
        leaveReturnPlan: function () {
            controller.openResumeScreen('leave-plan');
        },
        openSoftFinish: function () {
            controller.openResumeScreen('soft-finish');
        },
        updateResumeField: function (field, value) {
            var nextState = {};

            if (['whereIStopped', 'nextVisibleAction', 'dontForget'].indexOf(field) === -1) {
                return;
            }

            nextState[field] = clampText(value, 220);
            nextState.resumeSnapshot = createResumeSnapshot(Object.assign({}, controller.state, nextState));
            controller.updateState(nextState, {
                render: false
            });
        },
        returnToRoom: function () {
            var nextState = {
                screen: 'room',
                lastRoomEventAt: Date.now(),
                resumeReason: 'leave-plan'
            };

            nextState.resumeSnapshot = createResumeSnapshot(Object.assign({}, controller.state, nextState));
            controller.updateState(nextState);
        },
        completeSoftFinish: function () {
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

    if (this.state.screen === 'pre-flight') {
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
        return;
    }

    markup = renderResumeScreen(context);
    this.root.innerHTML = markup;
    this.cleanupScreen = bindResumeScreen(this.root, context, actions);
    this.pauseAmbientAudio();
};

export async function createFocusRoomV1App(config) {
    var emotionalStates = await loadEmotionalLibrary(config.emotionalStatesUrl);
    var storedState = loadStoredFlowState();
    var controller = new FocusRoomV1Controller({
        root: config.root,
        emotionalStates: emotionalStates,
        state: mergeStoredState(emotionalStates, storedState)
    });

    controller.render();
    controller.persist();
    return controller;
}
