# Legacy Hakeemi Baseline

This record closes the bounded legacy audit before the Expo rebuild. It is not
an instruction to restore the 2021 toolchain.

## Recovery point

- Annotated tag: `legacy-v1`
- Tagged commit: `dade72b7c7c0d2314ceb4b052c1f07821a306063`
- Commit date: 2021-07-26
- Runtime: React Native 0.64.1, React 17.0.1, TypeScript 4.2.3
- Package manager recorded by the project: Yarn 1 with `yarn.lock`

The tag points to the final legacy application commit. The modernization
roadmap was committed later and is intentionally not part of the legacy tag.

## Reproducibility audit

The audit ran from a detached temporary Git worktree so dependency installation
and native tooling could not modify `master`.

### Successful checks

- Yarn 1.22.22 installed the frozen legacy dependency graph.
- `tsc --skipLibCheck && eslint .` passed.
- All 12 Jest suites passed.
- All 36 tests and 13 snapshots passed.

The tests emitted one existing `react-i18next` initialization warning. The
warning does not affect the preserved result and will not be carried into the
new test architecture.

### Native build result

A current-device screenshot set was not produced because neither native build
reached compilation in the bounded audit:

- iOS dependency resolution spent several minutes cloning the obsolete
  BoringSSL-GRPC source dependency through the React Native 0.64/Firebase pod
  graph. The download was cancelled before changing legacy source.
- Android required the Gradle 6.7 distribution and was still downloading it
  when the bounded audit ended.

The local machine currently has Xcode 26.6, CocoaPods 1.16.2, and a current
Android Studio JBR. Proving the legacy native projects would require investing
in an obsolete toolchain before any product modernization begins. The source,
tests, repository banner, and Git tag are sufficient historical evidence.

The detached worktree and its downloaded dependencies were removed after the
audit.

## Legacy Firebase record

The checked-in mobile configuration identifies:

- Firebase project ID: `hakeemi`
- Project number: `559792786123`
- Android package: `com.Hakeemi`
- iOS bundle ID: `com.Hakeemi`
- Storage bucket: `hakeemi.appspot.com`

The mobile code uses React Native Firebase Auth and Firestore. Its implemented
authentication methods are email/password account creation, sign-in, sign-out,
and password reset. Firestore client code reads `Doctors` and `Users` and writes
appointments directly into a doctor document.

No Firestore rules, indexes, Functions source, Storage rules, emulator config,
or deployment configuration exists in the repository.

The Google account active on the development machine cannot read project
metadata, Firestore database metadata, service status, or indexes for the
legacy project. The project may have different ownership or no longer exist.

### Decision

- Do not reuse or mutate the legacy Firebase project.
- Treat it as an inaccessible historical environment.
- Remove its native mobile configuration from the modern scaffold.
- Create separate, explicitly owned development and production projects during
  Phase 2.
- Use local `demo-*` project IDs and the Firebase Emulator Suite for repeatable
  tests and screenshots.

This decision avoids coupling the rebuild to unknown rules, data, billing, or
ownership state.

## Visual and asset provenance

The legacy README attributes the interface to a free Figma community design,
but the linked page is no longer independently accessible through the available
web tooling and no asset license is stored in the repository.

The legacy SVG illustrations, background pattern, custom Fontello icon font,
remote doctor photographs, and repository banner are therefore reference-only.
They will not be copied into the new product UI or release artwork.

Safe concepts to preserve are:

- the Hakeemi product name;
- the patient/provider appointment domain;
- the broad discovery → provider → slot → confirmation journey;
- the historical README attribution when describing the 2021 version.

The new iconography, illustrations, provider imagery, screenshots, and hero art
must have original or explicitly documented provenance.

## Legacy screen inventory

The source and repository banner preserve these flows:

- Welcome and language selection
- Sign up, sign in, and password reset
- Drawer-based Home, Doctors, and Profile destinations
- Provider list and provider profile
- Available-day and time-slot appointment modal
- Static profile and appointment examples

The modern product behavior is defined by
[`docs/ROADMAP.md`](ROADMAP.md), not by undocumented details of the legacy UI.
