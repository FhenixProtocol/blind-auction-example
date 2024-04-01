import { defineNuxtPlugin } from '#app'
import { Tooltip } from 'bootstrap'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('tooltip', {
    mounted(el, binding) {
      new Tooltip(el, {
        html: true,
        title: binding.value,
        placement: binding.arg || 'top',
        trigger: 'hover focus',
      })
    },
    beforeUnmount(el) {
      const tooltip = Tooltip.getInstance(el)
      if (tooltip) {
        tooltip.dispose()
      }
    },
  })
})
