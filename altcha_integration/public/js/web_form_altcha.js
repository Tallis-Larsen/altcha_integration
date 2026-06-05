frappe.ready(function () {
	if (!frappe.web_form_doc || !frappe.web_form_doc.require_altcha_for_submit) {
		return;
	}

	import("https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js");

	const footer = document.querySelector(".web-form-footer");
	if (!footer) return;

	let altchaPayload = null;

	const widget = document.createElement("altcha-widget");
	widget.setAttribute(
		"challengeurl",
		"/api/method/altcha_integration.altcha_integration.api.get_challenge"
	);
	widget.setAttribute("name", "altcha");
	widget.style.display = "block";
	widget.style.marginBottom = "1rem";
	footer.parentElement.insertBefore(widget, footer);

	// Capture payload when ALTCHA verifies (statechange fires on solve/reset).
	widget.addEventListener("statechange", (e) => {
		if (e.detail?.state === "verified") {
			altchaPayload = e.detail.payload || widget.value || null;
		} else {
			altchaPayload = null;
		}
	});

	// For multi-step forms: mirror submit button visibility on the widget.
	const submitBtn = document.querySelector(".web-form-footer .submit-btn");
	if (submitBtn) {
		new MutationObserver(() => {
			widget.style.display = submitBtn.style.display === "none" ? "none" : "block";
		}).observe(submitBtn, { attributes: true, attributeFilter: ["style"] });
	}

	document.querySelector(".web-form").addEventListener(
		"submit",
		function (e) {
			if (!altchaPayload) {
				e.preventDefault();
				e.stopImmediatePropagation();
				frappe.msgprint(__("Please complete the ALTCHA challenge before submitting."));
				return;
			}
			// Inject into the doc so Frappe includes it in the data sent to accept().
			if (frappe.web_form) {
				frappe.web_form.doc.altcha = altchaPayload;
			}
		},
		true
	);
});
