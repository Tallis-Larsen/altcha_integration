### ALTCHA Integration

Provides ALTCHA integration for webforms.

### Usage

The app is pretty simple: The `ALTCHA Integration Settings` doctype is where you set the HMAC key, and a new `require_altcha_for_submit` checkbox has been added to the `Web Form` doctype to toggle the feature.

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch version-16
bench install-app altcha_integration
```

### License

agpl-3.0
