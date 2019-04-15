export function last<T> (array: Array<T>): T {
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

export function replaceAtIndex<T> (array: Array<T>, index: number, newItem: T): Array<T> {
  const left = array.slice(0, index)
  const right = array.slice(index + 1)
  return [...left, newItem, ...right]
}

export function replaceLast<T> (array: Array<T>, newItem: T): Array<T> {
  return replaceAtIndex(array, array.length - 1, newItem)
}

export function shuffle<T> (array: Array<T>) {
  for (let i = array.length; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
