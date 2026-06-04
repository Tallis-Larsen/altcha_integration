import hashlib
import hmac
import json
import os
import time

import frappe
from frappe import _


def _get_hmac_key():
	key = frappe.db.get_single_value("ALTCHA Integration Settings", "hmac_key")
	if not key:
		frappe.throw(_("ALTCHA HMAC key is not configured. Please set it in ALTCHA Integration Settings."))
	return key.encode()


# Generate an ALTCHA challenge for the client.
@frappe.whitelist(allow_guest=True)
def get_challenge():
	salt = os.urandom(12).hex()
	number = int.from_bytes(os.urandom(3), "big") % 100000
	algorithm = "SHA-256"
	challenge = hashlib.sha256(f"{salt}{number}".encode()).hexdigest()

	payload = json.dumps(
		{"algorithm": algorithm, "challenge": challenge, "salt": salt, "signature": ""},
		separators=(",", ":"),
	)
	signature = hmac.new(_get_hmac_key(), payload.encode(), hashlib.sha256).hexdigest()

	return {
		"algorithm": algorithm,
		"challenge": challenge,
		"salt": salt,
		"signature": signature,
	}


# Verify the ALTCHA payload submitted with a web form.
def verify_altcha_payload(encoded_payload: str) -> bool:
	import base64

	try:
		decoded = json.loads(base64.b64decode(encoded_payload))
	except Exception:
		return False

	algorithm = decoded.get("algorithm", "SHA-256")
	if algorithm != "SHA-256":
		return False

	salt = decoded.get("salt", "")
	number = decoded.get("number", 0)
	challenge = decoded.get("challenge", "")
	signature = decoded.get("signature", "")

	# Verify the challenge hash.
	expected_challenge = hashlib.sha256(f"{salt}{number}".encode()).hexdigest()
	if not hmac.compare_digest(expected_challenge, challenge):
		return False

	# Verify the HMAC signature.
	payload_str = json.dumps(
		{"algorithm": algorithm, "challenge": challenge, "salt": salt, "signature": ""},
		separators=(",", ":"),
	)
	expected_sig = hmac.new(_get_hmac_key(), payload_str.encode(), hashlib.sha256).hexdigest()
	return hmac.compare_digest(expected_sig, signature)


# Wrapper around frappe's web form accept that validates the ALTCHA payload first.
@frappe.whitelist(allow_guest=True)
def accept(web_form, data):
	from frappe.website.doctype.web_form.web_form import accept as frappe_accept

	web_form_doc = frappe.get_cached_doc("Web Form", web_form)
	if web_form_doc.require_altcha_for_submit:
		parsed = frappe._dict(json.loads(data))
		altcha_payload = parsed.get("altcha")
		if not altcha_payload or not verify_altcha_payload(altcha_payload):
			frappe.throw(_("ALTCHA verification failed. Please try again."))

	return frappe_accept(web_form, data)