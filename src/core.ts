import { Action, ActionTypes, MoveDestination, MoveDestinationType, MoveSource, MoveSourceType } from './actions'
import * as þ from './util'

export interface Game {
  deck: Card[]
  freeCards: Card[]
  stacks: Record<Suit, Card[]>
  bars: Card[][]
  allCards: Card[]
}

export const enum Suit {
  Clubs = '♣',
  Diamonds = '♦',
  Hearts = '♥',
  Spades = '♠',
}

export const ALL_SUITS = [
  Suit.Clubs,
  Suit.Diamonds,
  Suit.Hearts,
  Suit.Spades,
]

export const enum CardNumber {
  Ace = 'A',
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
}

export const ALL_CARD_NUMBERS = [
  CardNumber.Ace,
  CardNumber.Two,
  CardNumber.Three,
  CardNumber.Four,
  CardNumber.Five,
  CardNumber.Six,
  CardNumber.Seven,
  CardNumber.Eight,
  CardNumber.Nine,
  CardNumber.Ten,
  CardNumber.Jack,
  CardNumber.Queen,
  CardNumber.King,
]

export interface Card {
  suit: Suit
  number: CardNumber
  isFaceDown?: boolean
}

export function isRed (card: Card): boolean {
  return card.suit == Suit.Hearts || card.suit == Suit.Diamonds
}

export function isBlack (card: Card): boolean {
  return !isRed(card)
}

export function generateDeck (): Card[] {
  return ALL_SUITS.map(suit => ALL_CARD_NUMBERS.map(number => ({ number, suit }))).flat(1)
}

export function generateGame (_deck: Card[]): Game {
  const deck = [..._deck]
  const barsCount = 7

  const bars: Card[][] = []

  for (let i = 0; i < barsCount; i++) {
    bars[i] = []
    for (let j = 0; j < i; j++) {
      bars[i].push({ ...deck.pop()!, isFaceDown: true })
    }
    bars[i].push({ ...deck.pop()!, isFaceDown: false })
  }

  return {
    deck,
    bars,
    freeCards: [],
    stacks: {
      [Suit.Clubs]: [],
      [Suit.Diamonds]: [],
      [Suit.Hearts]: [],
      [Suit.Spades]: [],
    },
    allCards: [...deck, ...bars.flat(1)],
  }
}

export function areCardsEqual (card1: Card | null, card2: Card | null): boolean {
  if (card1 == null || card2 == null) return false
  return card1.suit == card2.suit && card1.number == card2.number
}

export function getNextNumber (number: CardNumber): CardNumber | null {
  const index = ALL_CARD_NUMBERS.indexOf(number)
  const nextNumber = ALL_CARD_NUMBERS[index + 1]
  if (nextNumber == null) return null
  return nextNumber
}

export function canStackInBars (below: Card, above: Card): boolean {
  const isColorOk = (isRed(below) && isBlack(above)) || (isBlack(below) && isRed(above))
  const isOrderOk = getNextNumber(above.number) == below.number
  return isColorOk && isOrderOk
}

export function canStackInStacks (below: Card, above: Card): boolean {
  const isColorOk = below.suit == above.suit
  const isOrderOk = getNextNumber(below.number) == above.number
  return isColorOk && isOrderOk
}

export function key (card: Card): string {
  return `${card.suit}${card.number}`
}

export function fromKey (key: string): Card {
  const suit = key[0] as Suit
  const number = key.slice(1) as CardNumber
  return { suit, number }
}

export function getCardGroup (game: Game, needle: Card): Card[] {
  // in bars
  for (const bar of game.bars) {
    for (let i = 0; i < bar.length; i++) {
      const card = bar[i]
      if (areCardsEqual(card, needle)) {
        return bar.slice(i)
      }
    }
  }

  // as free card
  const freeCard = þ.last(game.freeCards)
  if (freeCard != null && areCardsEqual(needle, freeCard)) return [freeCard]

  return []
}

class InvalidMove extends Error {
  constructor (details?: string) {
    const messageBase = `Invalid move.`
    const message = details == null ? messageBase : `${messageBase} ${details}`
    super(message)
    Object.setPrototypeOf(this, InvalidMove.prototype)
  }
}

export function react (game: Game, action: Action): Game {
  switch (action.type) {
    case ActionTypes.Move:
      return move(game, action.source, action.destination)
    case ActionTypes.OpenDeck:
      return openDeck(game)
    case ActionTypes.FlipCard:
      return flipCard(game, action.barIndex)
  }
}

function move (game: Game, source: MoveSource, destination: MoveDestination): Game {
  if (source.type == MoveSourceType.Free) {
    if (destination.type == MoveDestinationType.Bars) return moveFreeToBars(game, destination.barIndex)
    if (destination.type == MoveDestinationType.Stacks) return moveFreeToStacks(game, destination.suit)
  }
  if (source.type == MoveSourceType.Stacks) {
    if (destination.type == MoveDestinationType.Stacks) return moveStackToStacks(game, source.suit, destination.suit)
    if (destination.type == MoveDestinationType.Bars) return moveStacksToBars(game, source.suit, destination.barIndex)
  }
  if (source.type == MoveSourceType.Bars) {
    if (destination.type == MoveDestinationType.Stacks) return moveBarToStacks(game, source.barIndex, source.cardIndex, destination.suit)
    if (destination.type == MoveDestinationType.Bars) return moveBarToBar(game, source.barIndex, source.cardIndex, destination.barIndex)
  }
  throw new Error()
}

function canPlaceOnSuitStack (game: Game, stackSuit: Suit, card: Card): boolean {
  const stack = game.stacks[stackSuit]
  const destinationCard = þ.last(stack)

  // Cannot place in the wrong stack, full or empty
  if (stackSuit != card.suit) return false

  // Cannot place in the wrong order
  if (destinationCard != null && canStackInStacks(destinationCard, card)) return false

  // Otherwise it's fine
  return true
}


function checkPlacingOnSuitStack (game: Game, stackSuit: Suit, card: Card): void {
  if (!canPlaceOnSuitStack(game, stackSuit, card)) throw new InvalidMove()
}

export function getPossibleStackDestinations (game: Game, card: Card): Suit[] {
  return ALL_SUITS.filter(suit => canPlaceOnSuitStack(game, suit, card))
}

function canPlaceOnBar (game: Game, barIndex: number, card: Card): boolean {
  const bar = game.bars[barIndex]
  const destinationCard = þ.last(bar)

  // Cannot place on empty space unless the card is the strongest card
  if (destinationCard == null) return card.number == þ.last(ALL_CARD_NUMBERS)

  // Cannot place over an un-opened card
  if (destinationCard.isFaceDown) return false

  // Cannot place unless the card is directly weaker
  if (!canStackInBars(destinationCard, card)) return false

  // Otherwise it's fine
  return true
}

function checkPlacingOnBar (game: Game, barIndex: number, card: Card): void {
  if (!canPlaceOnBar(game, barIndex, card)) throw new InvalidMove()
}

export function getPossibleBarDestinations (game: Game, card: Card): number[] {
  return Array.from({ length: game.bars.length })
    .map((_, i) => i)
    .filter(barIndex => canPlaceOnBar(game, barIndex, card))
}

export function generateSource (game: Game, card: Card): MoveSource {
  const freeCard = þ.last(game.freeCards)
  if (freeCard != null && areCardsEqual(freeCard, card)) return {
    type: MoveSourceType.Free,
  }

  for (let barIndex = 0; barIndex < game.bars.length; barIndex++) {
    const bar = game.bars[barIndex]
    for (let cardIndex = 0; cardIndex < bar.length; cardIndex++) {
      const barCard = bar[cardIndex]
      if (barCard.isFaceDown) continue
      if (areCardsEqual(barCard, card)) {
        return {
          type: MoveSourceType.Bars,
          barIndex,
          cardIndex,
        }
      }
    }
  }

  for (const [suit, suitStack] of Object.entries(game.stacks)) {
    const topCard = þ.last(suitStack)
    if (topCard == null) continue
    if (areCardsEqual(topCard, card)) {
      return {
        type: MoveSourceType.Stacks,
        suit: suit as Suit,
      }
    }
  }

  throw new Error()
}

function getMovableCardsFromBars (game: Game): Card[] {
  return game.bars.map(bar => bar.filter(card => !card.isFaceDown)).flat(1)
}

function moveFreeToStacks (game: Game, stackSuit: Suit): Game {
  const sourceCard = þ.last(game.freeCards)

  if (sourceCard == null) throw new InvalidMove()
  checkPlacingOnSuitStack(game, stackSuit, sourceCard)

  const freeCards = þ.withoutLast(game.freeCards)
  const stacks = {
    ...game.stacks,
    [stackSuit]: [...game.stacks[stackSuit], sourceCard],
  }
  return { ...game, freeCards, stacks }
}

function moveFreeToBars (game: Game, destinationBarIndex: number): Game {
  const sourceCard = þ.last(game.freeCards)
  if (sourceCard == null) throw new InvalidMove()

  checkPlacingOnBar(game, destinationBarIndex, sourceCard)

  const freeCards = þ.withoutLast(game.freeCards)
  const bar = [...game.bars[destinationBarIndex], sourceCard]
  const bars = þ.replaceAtIndex(game.bars, destinationBarIndex, bar)
  return { ...game, freeCards, bars }
}

function moveStackToStacks (game: Game, sourceSuit: Suit, destinationSuit: Suit): Game {
  // Makes no sense to ever work since placing back on the source is handled globally
  throw new InvalidMove()
}

function moveStacksToBars (game: Game, sourceStackSuit: Suit, destinationBarIndex: number): Game {
  const sourceCard = þ.last(game.stacks[sourceStackSuit])

  if (sourceCard == null) throw new InvalidMove()
  if (sourceCard.isFaceDown) throw new InvalidMove()
  checkPlacingOnBar(game, destinationBarIndex, sourceCard)

  const stack = þ.withoutLast(game.stacks[sourceStackSuit])
  const stacks = { ...game.stacks, [sourceStackSuit]: stack }
  const bar = [...game.bars[destinationBarIndex], sourceCard]
  const bars = þ.replaceAtIndex(game.bars, destinationBarIndex, bar)
  return { ...game, stacks, bars }
}

function moveBarToStacks (game: Game, sourceBarIndex: number, sourceCardIndex: number, destinationStackSuit: Suit): Game {
  return game
}

function moveBarToBar (game: Game, sourceBarIndex: number, sourceCardIndex: number, destinationBarIndex: number): Game {
  const cardGroup = game.bars[sourceBarIndex].slice(sourceCardIndex)
  const sourceBar = game.bars[sourceCardIndex].slice(0, sourceCardIndex)
  const destinationBar = [...game.bars[destinationBarIndex], ...cardGroup]
  const bars = þ.replaceAtIndex(þ.replaceAtIndex(game.bars, destinationBarIndex, destinationBar), sourceBarIndex, sourceBar)
  return {
    ...game,
    bars,
  }
}

function openDeck (game: Game): Game {
  const card = þ.last(game.deck)
  if (card == null) throw new InvalidMove()

  const deck = þ.withoutLast(game.deck)
  const freeCards = [...game.freeCards, card]
  return { ...game, deck, freeCards }
}

function flipCard (game: Game, barIndex: number): Game {
  const card = þ.last(game.bars[barIndex])
  if (card == null) throw new InvalidMove()
  if (!card.isFaceDown) throw new InvalidMove()
  const flippedCard = { ...card, isFaceDown: false }
  const bar = þ.replaceLast(game.bars[barIndex], flippedCard)
  const bars = þ.replaceAtIndex(game.bars, barIndex, bar)
  return { ...game, bars }
}
