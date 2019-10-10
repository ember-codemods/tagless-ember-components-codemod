tagless-ember-components-codemod
==============================================================================

Converts regular Ember.js components to `tagName: ''` components


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


License
------------------------------------------------------------------------------

This projects is released under the [MIT License](LICENSE.md).
