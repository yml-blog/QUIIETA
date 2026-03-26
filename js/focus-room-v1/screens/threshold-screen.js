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
            '<div class="fr1-stage__presence" aria-hidden="true">' +
                '<span></span><span></span><span></span><span></span><span></span>' +
            '</div>' +
        '</div>';
}

export function renderThresholdScreen(context) {
    return '' +
        '<section class="fr1-screen fr1-screen--threshold">' +
            renderStage(context.derived.scene) +
            '<div class="fr1-screen__content fr1-threshold-layout">' +
                '<div class="fr1-panel fr1-panel--ghost fr1-threshold-card">' +
                    '<span class="fr1-kicker">Quieta</span>' +
                    '<h1 class="fr1-title">Enter gently</h1>' +
                    '<p class="fr1-copy">A calm space to start, return, and continue.</p>' +
                    '<button class="fr1-hold-button" data-fr1-hold-trigger data-holding="false" type="button" aria-describedby="fr1ThresholdPrompt">' +
                        '<span class="fr1-hold-label" data-fr1-hold-label>Hold to Enter</span>' +
                    '</button>' +
                    '<div class="fr1-hold-track" aria-hidden="true">' +
                        '<span data-fr1-hold-fill></span>' +
                    '</div>' +
                    '<p class="fr1-footnote" id="fr1ThresholdPrompt" data-fr1-hold-prompt>Hold for a breath. The next step can stay small.</p>' +
                '</div>' +
            '</div>' +
        '</section>';
}

export function bindThresholdScreen(root, context, actions) {
    var trigger = root.querySelector('[data-fr1-hold-trigger]');
    var holdLabel = root.querySelector('[data-fr1-hold-label]');
    var holdPrompt = root.querySelector('[data-fr1-hold-prompt]');
    var holdFill = root.querySelector('[data-fr1-hold-fill]');
    var holdFrame = 0;
    var isHolding = false;
    var startedAt = 0;
    var holdDuration = 1250;

    function updateProgress(progress) {
        var safeProgress = Math.min(1, Math.max(0, progress));

        if (trigger) {
            trigger.style.setProperty('--fr1-hold-progress', safeProgress.toFixed(3));
        }

        if (holdFill) {
            holdFill.style.transform = 'scaleX(' + safeProgress.toFixed(3) + ')';
        }

        if (holdLabel) {
            holdLabel.textContent = safeProgress >= 0.82 ? 'Almost there' : (isHolding ? 'Keep holding' : 'Hold to Enter');
        }

        if (holdPrompt) {
            holdPrompt.textContent = isHolding
                ? (safeProgress >= 0.82 ? 'The room is opening.' : 'Stay steady. Nothing else needs to happen yet.')
                : 'Hold for a breath. The next step can stay small.';
        }
    }

    function stopHold() {
        if (!isHolding) {
            return;
        }

        isHolding = false;
        window.cancelAnimationFrame(holdFrame);
        holdFrame = 0;

        if (trigger) {
            trigger.setAttribute('data-holding', 'false');
        }

        updateProgress(0);
    }

    function step(now) {
        var progress = (now - startedAt) / holdDuration;

        updateProgress(progress);

        if (progress >= 1) {
            isHolding = false;

            if (trigger) {
                trigger.setAttribute('data-holding', 'false');
            }

            actions.completeThreshold();
            return;
        }

        holdFrame = window.requestAnimationFrame(step);
    }

    function startHold(event) {
        if (event) {
            event.preventDefault();
        }

        if (isHolding) {
            return;
        }

        isHolding = true;
        startedAt = performance.now();

        if (trigger) {
            trigger.setAttribute('data-holding', 'true');
        }

        holdFrame = window.requestAnimationFrame(step);
    }

    function handleKeyDown(event) {
        if (event.key !== ' ' && event.key !== 'Enter') {
            return;
        }

        if (!isHolding) {
            startHold(event);
        }
    }

    function handleKeyUp(event) {
        if (event.key !== ' ' && event.key !== 'Enter') {
            return;
        }

        stopHold();
    }

    if (trigger) {
        trigger.addEventListener('pointerdown', startHold);
        trigger.addEventListener('pointerup', stopHold);
        trigger.addEventListener('pointerleave', stopHold);
        trigger.addEventListener('pointercancel', stopHold);
        trigger.addEventListener('keydown', handleKeyDown);
        trigger.addEventListener('keyup', handleKeyUp);
        trigger.addEventListener('blur', stopHold);
    }

    window.addEventListener('pointerup', stopHold);
    updateProgress(0);

    return function cleanupThresholdScreen() {
        window.cancelAnimationFrame(holdFrame);
        window.removeEventListener('pointerup', stopHold);

        if (!trigger) {
            return;
        }

        trigger.removeEventListener('pointerdown', startHold);
        trigger.removeEventListener('pointerup', stopHold);
        trigger.removeEventListener('pointerleave', stopHold);
        trigger.removeEventListener('pointercancel', stopHold);
        trigger.removeEventListener('keydown', handleKeyDown);
        trigger.removeEventListener('keyup', handleKeyUp);
        trigger.removeEventListener('blur', stopHold);
    };
}
