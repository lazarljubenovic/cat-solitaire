export function last<T> (array: Array<T>): T | undefined {
  return array[array.length - 1]
}

export function first<T> (array: Array<T>): T {
  return array[0]
}

export function withoutLast<T> (array: Array<T>): Array<T> {
  return array.slice(0, array.length - 1)
}

export function withoutFirst<T> (array: Array<T>): Array<T> {
  return array.slice(1)
}

export function isNotNullish<T extends any | undefined> (t: T): t is Exclude<T, undefined> {
  return t != null
}

export function replaceAtIndex<T> (array: Array<T>, index: number, newItem: T): Array<T> {
  const left = array.slice(0, index)
  const right = array.slice(index + 1)
  return [...left, newItem, ...right]
}

export function replaceLast<T> (array: Array<T>, newItem: T): Array<T> {
  return replaceAtIndex(array, array.length - 1, newItem)
}

export function shuffle<T> (arr: Array<T>) {
  let i = arr.length
  while (i != 0) {
    const j = Math.floor(Math.random() * i--)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function sleep (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function closest<T extends Element = Element> (elm: Element, selector: string): T | null {
  let current: Element | null = elm
  while (true) {
    if (current == null) return null
    if (current.matches(selector)) return current as T
    current = current.parentElement
  }
}
