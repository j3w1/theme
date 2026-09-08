# Date picker

Complete copy distribution from @j3w1/ui 1.1.0.

Serve this directory over HTTP and open index.html. For an existing app, copy
element.html where needed, load tokens.css and component.css, and import
runtime/register/date-picker.js once. Keep the complete runtime directory.
Use a unique ID prefix for each copied instance, updating for/ARIA references
together. Native controls retain native form behavior. No site or backend is
required. See LICENSE.md for code and specimen attribution.

Canonical contract: https://github.com/j3w1/theme/blob/v1.1.0/spec/components/date-picker.md

Package alternative: import '@j3w1/ui/register/date-picker';
Load '@j3w1/ui/tokens.css' and '@j3w1/ui/styles/date-picker.css'.

The package classes have refresh() for deliberate dynamic child replacement.
Properties change state; native input/change and documented j3w1 events report
interaction. Keep application persistence and authorization in the host app.
