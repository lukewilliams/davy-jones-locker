import { defineMenuItemType } from './registry.js'
import MenuCheckboxItem from './components/MenuCheckboxItem.vue'
import MenuItem from './components/MenuItem.vue'
import MenuLabel from './components/MenuLabel.vue'
import MenuRadioGroup from './components/MenuRadioGroup.vue'
import MenuSeparator from './components/MenuSeparator.vue'
import MenuSubmenu from './components/MenuSubmenu.vue'

defineMenuItemType('item', MenuItem)
defineMenuItemType('checkbox', MenuCheckboxItem)
defineMenuItemType('radio', MenuRadioGroup)
defineMenuItemType('submenu', MenuSubmenu)
defineMenuItemType('separator', MenuSeparator)
defineMenuItemType('label', MenuLabel)
