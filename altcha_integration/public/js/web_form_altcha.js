frappe.ready(function () {
	if (!frappe.web_form_doc || !frappe.web_form_doc.require_altcha_for_submit) {
		return;
	}

	// Load the ALTCHA web component from CDN
	import("https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js");

	// Inject the widget just before the submit button
	const submitBtn = document.querySelector(".web-form-footer .submit-btn");
	if (!submitBtn) return;

	const widget = document.createElement("altcha-widget");
	widget.setAttribute(
		"challengeurl",
		"/api/method/altcha_integration.api.get_challenge"
	);
	widget.setAttribute("name", "altcha");
	submitBtn.parentElement.insertBefore(widget, submitBtn);

	// Block submission until ALTCHA is solved
	document.querySelector(".web-form").addEventListener(
		"submit",
		function (e) {
			const payload = document.querySelector("altcha-widget")?.value;
			if (!payload) {
				e.preventDefault();
				e.stopImmediatePropagation();
				frappe.msgprint(__("Please complete the ALTCHA challenge before submitting."));
			}
		},
		true
	);
});
