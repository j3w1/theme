# @j3w1/ui

Development status: distribution infrastructure is being implemented. Consult
the generated manifest and release evidence before treating a build as available
or verified. This checkout has not yet completed its package acceptance gates.

The official web implementation of the j3w1 UI Theme Spec. Native HTML remains
the content and form interface; custom elements add the specified interactions.
The package uses True Black / Rose semantic tokens and ships no font binaries.

The root class entry has no registration side effects. Import individual
`@j3w1/ui/register/<component>` modules to register only what a page needs.
`@j3w1/ui/register` is the explicit complete registration bundle.

Load `@j3w1/ui/tokens.css` and the selected component styles. Keep labels, native
controls and ARIA relationships in the supplied markup. Components use light DOM
for static content, native form ownership and cross-framework composition;
documented semantic variables and anatomy classes are styling extension points.
Host CSS must not override those intentional component rules accidentally.

Use `j3w1-ui list` for machine-readable discovery. `j3w1-ui copy button --out
./button-copy` writes a complete independently runnable component directory.
`j3w1-ui kit --components button,dialog --out ./settings-kit` copies each selected
component with its full dependency closure. Existing destinations are refused.

The generated manifest, API tables, framework examples and copy manifests define
the actual available component entry points. They are built from maintained
implementations and canonical contracts; runtime evidence is published separately.

JavaScript class imports are safe during server rendering. Register elements in
the browser. Native child markup remains visible and usable without registration;
custom widget behavior requires the corresponding module.
