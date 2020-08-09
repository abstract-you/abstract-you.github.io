// Set this to `true` to enable deep-linking to specific steps, for testing
let deepLinks = false;

// Toggle test list
document.getElementById('testing').addEventListener('click', function(e) {
	document.getElementById('test-list').classList.toggle('invisible')
})

let hidden = 'd-none'

// We try to use any hash we get on load, but in practice this will always just
// clear it from the URL because the 'started' variable won't be set. This is a
// very simple way to keep people from deep-linking into the flow and skiping
// steps.
window.onload = function () {
	gotoStep(getStep());
};

// This is just a placeholder until I add recording. For now the Record buttons
// simply load the next step
document.querySelectorAll('button.next-step').forEach(el => {
	el.addEventListener('click', function(e) {
	// This has to be set to true or we'll go back to the begining
	deepLinks = true;
	let step = getStep();
	step++;
	gotoStep(step);
	})
});

function gotoStep(step) {
	// Try to detect deep linking. `deepLinks` will be set to false when you load
	// the page, but we set it to true when you start the flow.
	if (deepLinks) {
		// Only move ahead if the requested step is valid
		if (step === 0 || step === 1 || step === 2 || step === 3) {
			// First hide everything
			document.querySelectorAll('.step').forEach(el => {
				el.classList.add(hidden);
			});
			// Then show just the step we wanted
			document.getElementById('step-' + step).classList.remove(hidden);
			// Then update the URL with the new state
			history.pushState('', 'step ' + step, '#' + step);
		}
	} else {
		// Start from the beginning if you're trying to skip
		// First hide everything
			document.querySelectorAll('.step').forEach(el => {
				el.classList.add(hidden);
			});
		// Then show just step 0
			document.getElementById('step-0').classList.remove(hidden);
		// Then clear the bad hash
		history.pushState(
			'',
			document.title,
			window.location.pathname + window.location.search
		);
	}
}

// TODO: Should I clean up this input somehow?
function getStep() {
	let url = new URL(window.location.href);
	let hash = url.hash.substring(1);
	if (hash === '0' || hash === '1' || hash === '2' || hash === '3') {
		return parseInt(hash, 10);
	} else {
		return '0';
	}
}
