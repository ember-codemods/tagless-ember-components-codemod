# Changelog

## Release (2024-10-01)

tagless-ember-components-codemod 1.0.0 (major)

#### :boom: Breaking Change
* `tagless-ember-components-codemod`
  * [#196](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/196) drop support for node < 18 ([@mansona](https://github.com/mansona))

#### :rocket: Enhancement
* `tagless-ember-components-codemod`
  * [#198](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/198) add basic support for mixins on native classes ([@mansona](https://github.com/mansona))

#### :house: Internal
* `tagless-ember-components-codemod`
  * [#199](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/199) start using release-plan ([@mansona](https://github.com/mansona))
  * [#197](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/197) swap to pnpm ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## v0.5.0 (2020-04-19)

#### :rocket: Enhancement
* [#68](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/68) Detect and use collocated templates ([@jrjohnson](https://github.com/jrjohnson))
* [#66](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/66) Support TypeScript components ([@simonihmig](https://github.com/simonihmig))
* [#69](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/69) Handle static class name bindings ([@jrjohnson](https://github.com/jrjohnson))

#### :bug: Bug Fix
* [#65](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/65) Skip tagName='' tagless components ([@simonihmig](https://github.com/simonihmig))

#### Committers: 2
- Jonathan Johnson ([@jrjohnson](https://github.com/jrjohnson))
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))


## v0.4.0 (2020-02-25)

#### :boom: Breaking Change
* [#48](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/48) Drop Node 8 support ([@Turbo87](https://github.com/Turbo87))

#### :rocket: Enhancement
* [#59](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/59) Improve whitespace formatting of template code ([@jelhan](https://github.com/jelhan))
* [#44](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/44) Add support for native classes ([@simonihmig](https://github.com/simonihmig))
* [#58](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/58) Add `this.` prefix to `styleNamespace` property ([@lifeart](https://github.com/lifeart))
* [#50](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/50) Add support for passing paths or glob patterns as CLI options ([@jelhan](https://github.com/jelhan))
* [#51](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/51) Add support for `ariaRole` property ([@jelhan](https://github.com/jelhan))

#### :bug: Bug Fix
* [#53](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/53) Fix empty package.json dependencies ([@Turbo87](https://github.com/Turbo87))

#### :house: Internal
* [#43](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/43) Extract transforms and utils ([@simonihmig](https://github.com/simonihmig))

#### Committers: 4
- Alex Kanunnikov ([@lifeart](https://github.com/lifeart))
- Jeldrik Hanschke ([@jelhan](https://github.com/jelhan))
- Simon Ihmig ([@simonihmig](https://github.com/simonihmig))
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))


## v0.3.2 (2019-11-29)

#### :bug: Bug Fix
* [#28](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/28) Fix attributeBindings issue ([@vladucu](https://github.com/vladucu))

#### :house: Internal
* [#21](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/21) Add dependabot configuration file ([@Turbo87](https://github.com/Turbo87))

#### Committers: 2
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))
- vladucu ([@vladucu](https://github.com/vladucu))


## v0.3.1 (2019-11-29)

#### :rocket: Enhancement
* [#19](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/19) Add support for running on addons ([@vladucu](https://github.com/vladucu))

#### :house: Internal
* [#20](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/20) CI: Add "Release" workflow ([@Turbo87](https://github.com/Turbo87))

#### Committers: 2
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))
- vladucu ([@vladucu](https://github.com/vladucu))


## v0.3.0 (2019-10-28)

#### :rocket: Enhancement
* [#15](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/15) Add support for `ember-component-css` ([@Turbo87](https://github.com/Turbo87))

#### :bug: Bug Fix
* [#16](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/16) Skip components that use `this.elementId` ([@Turbo87](https://github.com/Turbo87))

#### :memo: Documentation
* [#17](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/17) README: Add caveat about passed in event hooks ([@Turbo87](https://github.com/Turbo87))

#### :house: Internal
* [#18](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/18) CI: Fix `on` configuration ([@Turbo87](https://github.com/Turbo87))

#### Committers: 1
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))


## v0.2.0 (2019-10-26)

#### :rocket: Enhancement
* [#12](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/12) Improve template wrapper output ([@Turbo87](https://github.com/Turbo87))

#### :memo: Documentation
* [#13](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/13) package.json: Fix project URLs ([@Turbo87](https://github.com/Turbo87))

#### :house: Internal
* [#11](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/11) Add Tests ([@Turbo87](https://github.com/Turbo87))
* [#7](https://github.com/ember-codemods/tagless-ember-components-codemod/pull/7) Setup GitHub actions ([@Turbo87](https://github.com/Turbo87))

#### Committers: 1
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))


## v0.1.0 (2019-10-10)

Initial release! 🎉
