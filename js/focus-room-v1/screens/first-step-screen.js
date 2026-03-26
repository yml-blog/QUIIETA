import { escapeHtml, renderStage } from './shared.js';

export function renderFirstStepScreen(context) {
    return '' +
        '<section class="fr1-screen fr1-screen--first-step">' +
            renderStage(context.derived.scene, { quiet: true }) +
            '<div class="fr1-screen__content fr1-flow-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-flow-card">' +
                    '<span class="fr1-kicker">Visible Next Step</span>' +
                    '<h1 class="fr1-title-lg">What is the smallest thing you could touch first?</h1>' +
                    '<p class="fr1-copy">Name the first visible action, not the whole effort. It should feel lighter than postponing.</p>' +
                    '<form data-fr1-first-step-form>' +
                        '<label class="fr1-input-label" for="fr1FirstStepInput">' +
                            '<span>First visible step</span>' +
                            '<textarea class="fr1-textarea" id="fr1FirstStepInput" data-fr1-first-step-input maxlength="220" placeholder="Open the draft and only rewrite the title.">' + escapeHtml(context.state.firstStep) + '</textarea>' +
                        '</label>' +
                        '<div class="fr1-inline-note">' +
                            '<span>This becomes the anchor, not the whole plan.</span>' +
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
