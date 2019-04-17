import * as view from './view'
import { moveCardElm } from './view'
import * as core from './core'
import * as þ from './util'
import { Action, ActionMove, ActionTypes, MoveDestination, MoveDestinationBars, MoveDestinationType } from './actions'


const config: view.Config = {
  w: window.innerWidth,
  h: window.innerHeight,
  cardW: window.innerWidth * 0.08 * 1.4,
  cardH: window.innerHeight * 0.12 * 1.4,
  pad: window.innerWidth * 0.02,
  gap: window.innerWidth * 0.02,
}

let game = core.generateGame(þ.shuffle(core.generateDeck()))

function react (action: Action) {
  console.log(game, action)
  game = core.react(game, action)
  console.log(game)
  console.log(`- - - - - - - - -`)
}

async function animateOpening () {
  await þ.sleep(200)
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = game.bars[j][i]
      view.moveCard(card, view.calcPosBar(config, j, i))
      await þ.sleep(60)
    }
  }
}

view.prepare(config, game.allCards.reverse())
animateOpening()

let gElms: SVGGElement[] | null = null
let dropHints: SVGGElement[] = []
let dx: number = 0
let dy: number = 0
let originalRect: ClientRect | null = null

document.addEventListener('mousedown', event => {
  const gElm = þ.closest<SVGGElement>(event.target as Element, 'g.card')
  console.log(gElm)
  if (gElm == null) return
  if (gElm.classList.contains('face-down')) return

  const card = core.fromKey(gElm.id)
  const cards = core.getCardGroup(game, card)
  gElms = cards.map(view.getCardElm)
  gElms.forEach(gElm => gElm.classList.add('dragging'))

  originalRect = gElm.getBoundingClientRect()
  dx = event.pageX - originalRect.left
  dy = event.pageY - originalRect.top

  gElms.forEach(elm => {
    view.getInteractiveRoot().append(elm)
  })

  const barDestinations = core.getPossibleBarDestinations(game, card)
  const barDropHints = barDestinations.map(barIndex => {
    const { x, y } = view.calcPosBar(config, barIndex, game.bars[barIndex].length)
    const dropHint = view.placeDropHint(config, x, y)
    const dropAction: MoveDestinationBars = { type: MoveDestinationType.Bars, barIndex }
    dropHint.dataset.destination = JSON.stringify(dropAction)
    return dropHint
  })

  dropHints.push(...barDropHints)

  dropHints.forEach(g => {
    g.addEventListener('mouseenter', () => g.classList.add('visible'))
    g.addEventListener('mouseout', () => g.classList.remove('visible'))
    g.addEventListener('mouseup', event => {
      event.stopPropagation()
      const source = core.generateSource(game, card)
      const destination = JSON.parse(g.dataset.destination!) as MoveDestination
      const action: ActionMove = { type: ActionTypes.Move, source, destination }
      switch (destination.type) {
        case MoveDestinationType.Bars:
          view.setPos(gElm, view.calcPosBar(config, destination.barIndex, game.bars[destination.barIndex].length))
          break
      }
      react(action)
      endDragging()
    })
  })
})

document.addEventListener('mousemove', event => {
  if (gElms == null) return
  const firstX = event.pageX - dx
  const firstY = event.pageY - dy
  gElms.forEach((gElm, index) => {
    const x = firstX
    const y = firstY + index * config.cardH / 4
    gElm.setAttribute('transform', `translate(${x} ${y})`)
  })
})

document.addEventListener('mouseup', event => {
  endDragging(true)
})

document.addEventListener('click', event => {
  const cardElm = þ.closest<SVGGElement>(event.target as Element, 'g.card.in-deck')
  if (cardElm == null) return
  const action: Action = { type: ActionTypes.OpenDeck }
  react(action)
  view.getInteractiveRoot().append(cardElm)
  setTimeout(() => moveCardElm(cardElm, view.calcPosFreeCard(config)))
})

function endDragging (returnToInitial: boolean = false) {
  if (gElms == null) return
  dropHints.forEach(hint => hint.remove())
  dropHints = []
  if (returnToInitial) returnToInitialPosition()
  gElms.forEach(gElm => gElm.classList.remove('dragging'))
  gElms = null
}

function returnToInitialPosition () {
  const firstX = originalRect!.left
  const firstY = originalRect!.top
  gElms!.forEach((gElm, index) => {
    const x = firstX
    const y = firstY + index * config.cardH / 4
    gElm.setAttribute('transform', `translate(${x} ${y})`)
  })
}


