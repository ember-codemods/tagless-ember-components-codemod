tagless-ember-components-codemod
==============================================================================

Converts regular Ember.js components to `tagName: ''` components

**This codemod is experimental and might break your app. Make sure to
review the changes that it creates!**


Usage
------------------------------------------------------------------------------

```bash
npx tagless-ember-components-codemod
```


Example
------------------------------------------------------------------------------

```js
import Component from '@ember/component';

export default Component.extend({
  tagName: 'button',
  attributeBindings: ['disabled', 'disabled:aria-disabled'],
  classNames: ['custom-button'],
  classNameBindings: ['blue:blue:red'],
});
```

```hbs
{{@text}}
```

will be migrated to:

```js
import Component from '@ember/component';

export default Component.extend({
  tagName: '',
});
```

```hbs
<button disabled={{disabled}} aria-disabled={{disabled}} class="custom-button {{if this.blue "blue" "red"}}">
  {{@text}}
</button>
```


Configuration
------------------------------------------------------------------------------

### Paths

By default, `tagless-ember-components-codemod` will process components in the
following folders relatively to project root:

```
app/components
addon/components
```

You may pass alternative paths or globs as arguments:

```bash
# process one component only
npx tagless-ember-components-codemod app/components/my-component.js

# process a component and all components under it's namespace
npx tagless-ember-components-codemod app/components/my-component.js app/components/my-component/

# process all components matching a glob
npx tagless-ember-components-codemod app/components/**/foo-*.js
```

### Debug

Debug logging could be enabled by setting `DEBUG` environment variable to
`tagless-ember-components-codemod`:

```bash
DEBUG=tagless-ember-components-codemod npx tagless-ember-components-codemod
```


Known Caveats
------------------------------------------------------------------------------

- Due to the way `jscodeshift` works it sometimes removes empty lines between
  component properties, or adds new ones unexpectedly

- Since `click()` and other event hooks don't work for tagless components,
  passing in something like `@click=(action ...)` also will not work anymore

- [Open Issues](https://github.com/ember-codemods/tagless-ember-components-codemod/issues)


License
------------------------------------------------------------------------------

This projects is released under the [MIT License](LICENSE.md).
