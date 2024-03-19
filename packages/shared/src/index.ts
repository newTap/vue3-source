export const isObject =  (value:unknown) => typeof value === 'object' && value !== null

export const isArray = Array.isArray

export const isString = (val: unknown): val is string => typeof val === 'string'

export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

export const isObj = (val:unknown): val is object => (!!val) && (typeof val === 'object')

export const isIntegerKey = (key: unknown) =>  isString(key)&&key[0]!='_'&&parseInt(key, 10)+'' === key

export const hasOwn = (target: object, key: string | symbol): boolean => target.hasOwnProperty(key)

export const hasChange = (value:unknown, oldValue:unknown) => value !== oldValue

export const isRef = (val: any) => !!val.__v_isRef