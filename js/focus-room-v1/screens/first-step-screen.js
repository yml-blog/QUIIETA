function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderStage(scene) {
    return '' +
        '<div class="fr1-stage">' +
            '<video class="fr1-stage__video" autoplay muted loop playsinline preload="metadata">' +
                '<source src="' + scene.videoSrc + '" type="video/mp4">' +
            '</video>' +
            '<div class="fr1-stage__scrim"></div>' +
            '<div class="fr1-stage__warmth"></div>' +
            '<div class="fr1-stage__fog"></div>' +
            '<div class="fr1-stage__glass"></div>' +
        '</div>';
}

export function renderFirstStepScreen(context) {
    return '' +
        '<section class="fr1-screen fr1-screen--first-step">' +
            renderStage(context.derived.scene) +
            '<div class="fr1-screen__content fr1-flow-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-flow-card">' +
                    '<span class="fr1-kicker">First Small Step</span>' +
                    '<h1 class="fr1-title-lg">What is the first visible thing?</h1>' +
                    '<p class="fr1-copy">Keep it small enough that beginning feels lighter than postponing.</p>' +
                    '<form data-fr1-first-step-form>' +
                        '<label class="fr1-input-label" for="fr1FirstStepInput">' +
                            '<span>First step</span>' +
                            '<textarea class="fr1-textarea" id="fr1FirstStepInput" data-fr1-first-step-input maxlength="220" placeholder="Open the draft and rewrite the first sentence.">' + escapeHtml(context.state.firstStep) + '</textarea>' +
                        '</label>' +
                        '<div class="fr1-inline-note">' +
                            '<span>This becomes the quiet anchor inside the room.</span>' +
                        '</div>' +
                        '<div class="fr1-actions">' +
                            '<button class="fr1-button fr1-button--subtle" data-fr1-back type="button">Back</button>' +
                            '<button class="fr1-button fr1-button--primary" data-fr1-continue type="submit">Continue</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>' +
        '</section>';
}

export function bindFirstStepScreen(root, context, actions) {
    var form = root.querySelector('[data-fr1-first-step-form]');
    var input = root.querySelector('[data-fr1-first-step-input]');
    var backButton = root.querySelector('[data-fr1-back]');
    var continueButton = root.querySelector('[data-fr1-continue]');

    function syncButtonState() {
        if (!continueButton || !input) {
            return;
        }

        continueButton.disabled = !input.value.trim();
    }

    function handleSubmit(event) {
        event.preventDefault();
        actions.submitFirstStep(input ? input.value : '');
    }

    function handleBack() {
        actions.backToThreshold();
    }

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (input) {
        input.addEventListener('input', syncButtonState);
        window.setTimeout(function () {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
    }

    if (backButton) {
        backButton.addEventListener('click', handleBack);
    }

    syncButtonState();

    return function cleanupFirstStepScreen() {
        if (form) {
            form.removeEventListener('submit', handleSubmit);
        }

        if (input) {
            input.removeEventListener('input', syncButtonState);
        }

        if (backButton) {
            backButton.removeEventListener('click', handleBack);
        }
    };
}
