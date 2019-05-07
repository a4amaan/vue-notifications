import { ComponentOptions, PluginObject, VueConstructor } from 'vue'
// tslint:disable-next-line:no-submodule-imports
import { Vue } from 'vue/types/vue'

enum MESSAGE_TYPE {
  error = 'error',
  warn = 'warn',
  info = 'info',
  success = 'success'
}

// TODO (S.Panfilov) return type object
function getValues(vueApp: Vue, config: any): object {
  // TODO (S.Panfilov) any
  const result: any = {}

  Object.keys(config).forEach((field: string) => {
    if (field === 'cb') {
      result[field] = config[field].bind(vueApp)
    } else {
      result[field] = (typeof config[field] === 'function') ? config[field].call(vueApp) : config[field]
    }
  })

  return result
}

// TODO (S.Panfilov) any
function showMessage(config: any, vueApp: Vue): any {
  const valuesObj: any = getValues(vueApp, config)
  // TODO (S.Panfilov) any
  const isMethodOverridden: boolean = (<any>VueNotifications.pluginOptions)[valuesObj.type]
  // TODO (S.Panfilov) any
  const method = isMethodOverridden ? (<any>VueNotifications.pluginOptions)[valuesObj.type] : console.log
  method(valuesObj, vueApp)

  if (config.cb) return config.cb()
}

// TODO (S.Panfilov) do we need this method?
// TODO (S.Panfilov) any
// function addMethods(targetObj: any, typesObj: any, vueConstructor: VueConstructor): void {
//   // TODO (S.Panfilov) any
//   Object.keys(typesObj).forEach((v: any) => {
//     // TODO (S.Panfilov) any
//     targetObj[typesObj[v]] = (config: any) => {
//       config.type = typesObj[v]
//       return showMessage(config, vueConstructor as any)
//     }
//   })
// }

function setMethod(vueApp: Vue, name: string, componentOptions: ComponentOptions<Vue>): void {
  if (!componentOptions.methods) componentOptions.methods = {}

  if (!componentOptions.methods[name]) {
    componentOptions.methods[name] = makeMethod(vueApp, name, componentOptions)
  }
}

// TODO (S.Panfilov) any
function makeMethod(vueApp: Vue, configName: string, componentOptions: ComponentOptions<Vue>): (config: any) => any {
// TODO (S.Panfilov) any
  return (config: any) => {
    const newConfig = {
      ...VueNotifications.config,
      // TODO (S.Panfilov)  ts ignore
      // @ts-ignore
      ...componentOptions[VueNotifications.propertyName][configName],
      ...config
    }

    return showMessage(newConfig, vueApp)
  }
}

function initVueNotificationPlugin(vueApp: Vue, notifications: NotificationsObject): void {
  if (!notifications) return
  Object.keys(notifications).forEach(name => setMethod(vueApp, name, vueApp.$options))
  vueApp.$emit('vue-notifications-initiated')
}

// TODO (S.Panfilov) any
function unlinkVueNotificationPlugin(vueApp: Vue, notifications: any): void {
  if (!notifications) return
  const { methods } = vueApp.$options
  if (!methods) return

  Object.keys(notifications).forEach(name => {
    if (methods[name]) {
      // TODO (S.Panfilov) this is not allowed, let's see if we can live without this string
      (<any>methods)[name] = undefined
      delete methods[name]
    }
  })

  vueApp.$emit('vue-notifications-unlinked')
}

function makeMixin(): Mixin {

  return {
    // TODO (S.Panfilov) I'm not sure now how to solve issue with "this" properly
    // tslint:disable-next-line:object-literal-shorthand
    beforeCreate: function(): void {
      // TODO (S.Panfilov) ts-ignore
      // @ts-ignore
      const notificationsField: NotificationsObject = this.$options[VueNotifications.propertyName]
      // TODO (S.Panfilov) ts-ignore
      // @ts-ignore
      if (notificationsField) initVueNotificationPlugin(this, notificationsField)
    },
    // tslint:disable-next-line:object-literal-shorthand
    beforeDestroy: function(): void {
      // TODO (S.Panfilov) ts-ignore
      // @ts-ignore
      const notificationsField = this.$options[VueNotifications.propertyName]
      // TODO (S.Panfilov) ts-ignore
      // @ts-ignore
      unlinkVueNotificationPlugin(this, notificationsField)
    }
  }
}

const VueNotifications: VueNotificationsPlugin = {
  types: {
    error: MESSAGE_TYPE.error,
    warn: MESSAGE_TYPE.warn,
    info: MESSAGE_TYPE.info,
    success: MESSAGE_TYPE.success
  },
  propertyName: 'notifications',
  config: {
    type: MESSAGE_TYPE.info,
    timeout: 3000
  },
  pluginOptions: {},
  installed: false,
  install(vueConstructor: VueConstructor, pluginOptions: ComponentOptions<Vue>): void {
    if (this.installed) throw console.error('VueNotifications: plugin already installed')
    const mixin = makeMixin()
    vueConstructor.mixin(mixin)

    this.setPluginOptions(pluginOptions)
    // TODO (S.Panfilov) do we need addMethods method?
    // addMethods(this, this.types, vueConstructor)

    this.installed = true
  },
  setPluginOptions(pluginOptions: ComponentOptions<Vue>): void {
    this.pluginOptions = pluginOptions
  }
}

export interface NotificationsObject {
  readonly [key: string]: MessageData
}

export interface MessageData {
  type: string,
  message: string,
  title: string
}

// TODO (S.Panfilov)  any
export interface VueNotificationsPlugin extends PluginObject<any> {
  types: { [key: string]: MESSAGE_TYPE | string },
  propertyName: string,
  config: {
    type: MESSAGE_TYPE | string,
    timeout: number
  },
  pluginOptions: ComponentOptions<Vue>,
  installed: boolean,
  install: (vue: VueConstructor, pluginOptions: ComponentOptions<Vue>) => void,
  // TODO (S.Panfilov) any
  setPluginOptions: (options: any) => void
}

if (typeof window !== 'undefined' && (window as any).Vue) {
  (window as any).Vue.use(VueNotifications)
}

export interface Mixin {
  // TODO (S.Panfilov) any
  beforeCreate: () => any
  // TODO (S.Panfilov) any
  beforeDestroy: () => any
}

export default VueNotifications
