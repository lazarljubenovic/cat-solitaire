import * as core from './core'
import { Suit } from './core'
import { Geometry } from 'planimetry'

const BARS_COUNT = 7

export interface Config {
  w: number
  h: number
  cardW: number
  cardH: number
  pad: number
  gap: number
}

export function calcPosDeck (config: Config): Geometry.Point.T {
  const x = config.gap
  const y = config.gap
  return { x, y }
}

export function calcPosFreeCard (config: Config): Geometry.Point.T {
  const x = config.gap + config.cardW + config.gap
  const y = config.gap
  return { x, y }
}

export function calcPosStacks (config: Config): Geometry.Point.T {
  const x = config.w - 4 * config.cardW - 3 * config.gap
  const y = config.gap
  return { x, y }
}

function calcPosBars (config: Config): Geometry.Point.T {
  const x = config.pad
  const y = config.pad + config.cardH + config.gap
  return { x, y }
}

export function calcPosBar (config: Config, barIndex: number, cardIndex: number): Geometry.Point.T {
  const barsWidth = config.w - 2 * config.pad
  const barsGap = (barsWidth - (BARS_COUNT * config.cardW)) / (BARS_COUNT - 1)
  const x = (config.cardW + barsGap) * barIndex
  const y = cardIndex * config.cardH / 4
  const pos = { x, y }
  return Geometry.Point.add(pos, calcPosBars(config))
}

export function getCardElm (card: core.Card): SVGGElement {
  const id = core.key(card)
  const elm = document.getElementById(id) as unknown as SVGGElement
  return elm
}

export function getInteractiveRoot () {
  return document.getElementById('interactive') as unknown as SVGGElement
}

export function getBackgroundRoot () {
  return document.getElementById('background') as unknown as SVGGElement
}

export function getDropHintsRoot () {
  return document.getElementById('drop-hints') as unknown as SVGGElement
}

export function moveCard (card: core.Card,
                          destination: Geometry.Point.T): SVGGElement {
  const cardElm = getCardElm(card)
  return moveCardElm(cardElm, destination)
}

export function moveCardElm (cardElm: SVGGElement, destination: Geometry.Point.T): SVGGElement {
  cardElm.classList.remove('in-deck')
  return setPos(cardElm, destination)
}

export function setPos (elm: SVGGElement, position: Geometry.Point.T): SVGGElement {
  elm.setAttribute('transform', `translate(${position.x} ${position.y})`)
  return elm
}

export function prepare (config: Config, cards: core.Card[]) {
  const svgRoot = document.getElementById('root') as unknown as SVGElement

  const pos = calcPosDeck(config)
  const x = pos.x
  const y = pos.y
  const cardElms = cards.reverse().map(card => generateCard(config, card, x, y))

  const defsElm = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const filterElm = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
  filterElm.id = 'shadow'
  const feDropShadowElm = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow')
  feDropShadowElm.setAttribute('dx', '0')
  feDropShadowElm.setAttribute('dy', '2')
  feDropShadowElm.setAttribute('stdDeviation', '0')
  feDropShadowElm.setAttribute('flood-opacity', '0.33')
  filterElm.append(feDropShadowElm)
  defsElm.append(filterElm)

  const backgroundGroupElm = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  backgroundGroupElm.id = 'background'

  const deckElm = generateCard(config, { number: '-0' as any, suit: '-' as any, isFaceDown: true }, x, y)
  const deckBelowElm = generateCard(config, { number: '-1' as any, suit: '-' as any, isFaceDown: true }, x, y)
  backgroundGroupElm.append(deckBelowElm, deckElm)

  const dropHintsGroupElm = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  dropHintsGroupElm.id = 'drop-hints'

  const interactiveGroupElm = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  interactiveGroupElm.id = 'interactive'

  interactiveGroupElm.append(...cardElms)
  svgRoot.append(defsElm, backgroundGroupElm, interactiveGroupElm, dropHintsGroupElm)

  const style = `
    .in-deck {
      transform: translate(${x - 4}px, ${y})
    }
  `
}

function generateCard (config: Config, card: core.Card, x: number, y: number): SVGGElement {
  const gElm = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  gElm.setAttribute('transform', `translate(${x}, ${y})`)
  gElm.setAttribute('id', core.key(card))
  gElm.classList.add('card')

  const rectElm = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rectElm.setAttribute('width', config.cardW.toString())
  rectElm.setAttribute('height', config.cardH.toString())
  rectElm.setAttribute('fill', 'white')
  rectElm.setAttribute('rx', '10')
  rectElm.setAttribute('ry', '10')
  rectElm.setAttribute('stroke', 'rgba(0, 0, 0, .1)')
  rectElm.setAttribute('filter', 'url(#shadow)')

  const suitElm = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  suitElm.setAttribute('x', (config.cardW * 0.4).toString())
  suitElm.setAttribute('y', '20')
  suitElm.setAttribute('text-anchor', 'middle')
  suitElm.innerHTML = card.suit

  const numberElm = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  numberElm.setAttribute('x', (config.cardW * 0.6).toString())
  numberElm.setAttribute('y', '20')
  numberElm.setAttribute('text-anchor', 'middle')
  numberElm.textContent = card.number

  if (card.isFaceDown) {
    suitElm.style.opacity = '0'
    numberElm.style.opacity = '0'
    gElm.classList.add('face-down')
  }

  if (card.suit == Suit.Diamonds || card.suit == Suit.Hearts) {
    gElm.setAttribute('fill', 'red')
  }

  gElm.classList.add('in-deck')

  gElm.append(rectElm, suitElm, numberElm)

  return gElm
}

function createDropHint (config: Config): SVGGElement {
  const root = getInteractiveRoot()

  const gElm = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  const rectElm = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rectElm.setAttribute('fill', 'rgba(255, 255, 255, .66)')
  rectElm.setAttribute('stroke', 'white')
  rectElm.setAttribute('stroke-width', '3')
  rectElm.setAttribute('width', config.cardW.toString())
  rectElm.setAttribute('height', config.cardH.toString())
  rectElm.setAttribute('rx', '10')
  rectElm.setAttribute('ry', '10')

  gElm.append(rectElm)
  return gElm
}

export function placeDropHint (config: Config, x: number, y: number): SVGGElement {
  const dropHintRoot = getDropHintsRoot()
  const dropHint = createDropHint(config)
  const transform = `translate(${x}, ${y})`
  dropHint.setAttribute('transform', transform)
  dropHintRoot.append(dropHint)
  return dropHint
}


// export function getCardElByCardId (cardId: string): HTMLDivElement {
//   const cardEl = document.getElementById(cardId) as undefined | HTMLDivElement
//   if (cardEl == null) throw new Error()
//   return cardEl
// }
//
// export function getGroupElByCardId (cardId: string): HTMLDivElement {
//   const cardEl = getCardElByCardId(cardId)
//   return cardEl.parentElement!.parentElement as HTMLDivElement
// }
//
// export function getBarByIndex (barIndex: number) {
//   const barsEl = document.getElementById('bars') as HTMLDivElement
//   const bar = barsEl.children.item(barIndex) as HTMLDivElement
//   return bar
// }
//
// export function getOuterBarGroupByIndex (barIndex: number) {
//   const bar = getBarByIndex(barIndex)
//   const outerGroup = bar.firstElementChild as HTMLDivElement
//   return outerGroup
// }
//
// export function getDeepestBarGroupByIndex (barIndex: number) {
//   const outerGroup = getOuterBarGroupByIndex(barIndex)
//   const deepestGroupEl = getDeepestGroup(outerGroup)
//   return deepestGroupEl
// }
//
// export function getDeepestGroup (groupElement: HTMLDivElement): HTMLDivElement {
//   let current: HTMLDivElement = groupElement
//   while (true) {
//     const children = Array.from(current.children)
//     const childGroup = children.find(el => el.classList.contains('group')) as HTMLDivElement | undefined
//     if (childGroup == undefined) return current
//     current = childGroup
//   }
// }
//
// export function getDeckCoordinates (): { x: number, y: number } {
//   const fddEl = document.getElementById('face-down-deck') as HTMLDivElement
//   const { left: x, top: y } = fddEl.getBoundingClientRect()
//   return { x, y }
// }
//
//
// export function addDirectlyToBar (cardNumber: core.CardNumber, suit: core.Suit, destinationBarIndex: number) {
//   const newGroupEl = createGroup(cardNumber, suit)
//   const destinationGroup = getDeepestBarGroupByIndex(destinationBarIndex)
//   const deckCoords = getDeckCoordinates()
//   destinationGroup.append(newGroupEl)
//   flipByCoordinates(newGroupEl, deckCoords.x, deckCoords.y)
// }
//
// export function moveToBar (sourceGroupEl: HTMLDivElement, barIndex: number) {
//   const destinationGroupEl = getDeepestBarGroupByIndex(barIndex)
//   const sourceGroupRect = sourceGroupEl.getBoundingClientRect()
//   destinationGroupEl.appendChild(sourceGroupEl)
//   flipByCoordinates(sourceGroupEl, sourceGroupRect.left, sourceGroupRect.top)
// }
//
// export function flipByCoordinates (destinationGroupEl: HTMLDivElement, x: number, y: number) {
//   const { top, left } = destinationGroupEl.getBoundingClientRect()
//   const transformX = x - left
//   const transformY = y - top
//   const style = `translate(${transformX}px, ${transformY}px)`
//   console.log(style)
//   // destinationGroupEl.style.transition = `all .2s ease-out`
//   destinationGroupEl.style.transform = style
//
//   function after () {
//     destinationGroupEl.style.transition = `all .2s ease-out`
//     destinationGroupEl.style.transform = `translate(0, 0)`
//   }
//
//   setTimeout(after)
// }
//
// export function flipFromDeck (destinationGroupEl: HTMLDivElement) {
//   const fddEl = document.getElementById('face-down-deck') as HTMLDivElement
//   const { left: x, top: y } = fddEl.getBoundingClientRect()
//   flipByCoordinates(destinationGroupEl, x, y)
// }
//
// //
// // export function flipByCard (destinationGroupEl: HTMLDivElement, cardId: string) {
// //   const cardEl = document.getElementById(cardId) as HTMLDivElement
// //   if (cardEl == null) flipFromDeck(destinationGroupEl)
// //   const { left: x, top: y } = cardEl.getBoundingClientRect()
// //   flipByCoordinates(destinationGroupEl, x, y)
// // }
//

