# Frontend visual standard

The kernel and frontend modules use Naive UI as the shared component library. The current login is the visual reference.

- Preserve Naive UI's default border radii, sizing, borders, focus states and interactions for buttons, inputs and other controls. Do not replace them with page-specific component CSS.
- Use the shared indigo palette and typography from `web/src/theme.js`. The host applies this theme through NConfigProvider.
- Use Naive UI components for forms, validation, buttons, dividers, dialogs and feedback. Keep layouts clean, with clear hierarchy and generous spacing.
- Put page-specific layout CSS in scoped styles. Global component adjustments belong in the host.
- Autofill styling in `web/src/styles.css` keeps input backgrounds consistent with the active theme while preserving browser credential filling.
- The host owns the Brazilian Portuguese locale and message, notification and dialog providers. Modules consume those providers without introducing a conflicting theme.
- Frontend modules declare compatible `vue` and `naive-ui` peer dependencies and import only the components they use.
- Maintain accessible labels, keyboard navigation, loading/error states and responsive layouts.

Image panels use the same border radius as buttons and inputs, read from the shared Naive UI theme. Decorative branding can use its own geometry.

## Client login artwork

The login uses a centered form and decorative side artwork, inspired by the approved reference. The Spire mark is a reusable component in `web/src/components/SpireMark.vue`. Controls retain Naive UI defaults, including radius, autofill styling and disabled/loading states.

The default artwork is `web/public/images/login-art.svg`. Replace this file per client to customize the login without changing the form. Alternatively, place a client image in `web/public/images/` and configure the project root `.env`:

```env
VITE_LOGIN_ART_URL=/images/client-login.svg
```

Use artwork with a quiet or transparent center so it does not compete with the form. The image is decorative, hidden on small screens and does not contain required information. If it fails to load, the form remains usable on a white background.

VITE variables are public frontend configuration, embedded at build time. Restart development after changing the variable; rebuild for deployment. Do not put secrets in VITE variables. The Vite envDir points at the project root so frontend and API settings can share the root .env.

## Sidebar prototype

ShellSidebar uses the shared Spire mark and Naive UI NMenu. It is 250px expanded and 76px collapsed. The topbar toggle changes modes; collapsed groups expose native flyout menus on hover. Fixed demonstration groups cover overview, workspace, people, files, reports and settings; their leaf actions display an explanatory message. Installed module entries still come from the module registry and navigate to their real routes. On narrow screens the sidebar starts collapsed and expansion uses an overlay.
