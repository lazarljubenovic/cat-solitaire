import { h } from 'snabbdom'
import * as core from './core'
import * as þ from './util'
import { Action, ActionTypes } from './actions'
import { VNode } from 'snabbdom/vnode'

export function Card (card: core.Card) {
  const key = core.key(card)
  return h(`div#${key}.card.suit-${card.suit}.number-${card.number}`, { key }, [
    h(`span.number`, [card.number]),
    h(`span.suit`, [card.suit]),
  ])
}

export function FaceDownCard () {
  return h('div.card.face-down')
}

export function Deck (
  deck: core.Game['deck'],
  freeCards: core.Game['freeCards'],
  react: (action: Action) => void,
) {
  return h('div.deck', [
    h('div.face-down-deck', { on: { click: () => react({ type: ActionTypes.OpenDeck }) } }, [FaceDownCard()]),
    h('div.free-card', [
      freeCards.length == 0 ? '' : Card(þ.last(freeCards)),
    ]),
  ])
}

export function Stack () {

}

export function BarGroup (partialBar: core.Card[]): VNode | null {
  const [first, ...rest] = partialBar
  return partialBar.length == 0
    ? null
    : h('div.bar-group', [
      h('div.card-wrapper', [first.isFaceDown ? FaceDownCard() : Card(first)]),
      BarGroup(rest),
    ])
}

export function Bar (bar: Unwrap<core.Game['bars']>) {
  return h('div.bar', BarGroup(bar))
}

export function Game (
  game: core.Game,
  react: (action: Action) => void,
) {
  return h('div.board', [
    Deck(game.deck, game.freeCards, react),
    h('div.stacks', []),
    h('div.bars', game.bars.map(Bar)),
  ])
}


