import { Suit } from './core'

export const enum ActionTypes {
  Move,
  OpenDeck,
  FlipCard,
}

interface ActionGeneral<T extends ActionTypes> {
  type: T
}

export const enum MoveSourceType {
  Free,
  Stacks,
  Bars,
}

interface MoveSourceGeneral<T extends MoveSourceType> {
  type: T
}

export interface MoveSourceFree extends MoveSourceGeneral<MoveSourceType.Free> {
}

export interface MoveSourceStacks extends MoveSourceGeneral<MoveSourceType.Stacks> {
  suit: Suit
}

export interface MoveSourceBars extends MoveSourceGeneral<MoveSourceType.Bars> {
  barIndex: number
  card: number
}

export type MoveSource = MoveSourceFree | MoveSourceStacks | MoveSourceBars

export const enum MoveDestinationType {
  Stacks,
  Bars,
}

interface MoveDestinationGeneral<T extends MoveDestinationType> {
  type: T
}

export interface MoveDestinationStacks extends MoveDestinationGeneral<MoveDestinationType.Stacks> {
  suit: Suit
}

export interface MoveDestinationBars extends MoveDestinationGeneral<MoveDestinationType.Bars> {
  barIndex: number
}

export type MoveDestination = MoveDestinationStacks | MoveDestinationBars

export interface ActionMove extends ActionGeneral<ActionTypes.Move> {
  source: MoveSource
  destination: MoveDestination
}

export interface ActionOpenDeck extends ActionGeneral<ActionTypes.OpenDeck> {
}

export interface ActionFlipCard extends ActionGeneral<ActionTypes.FlipCard> {
  barIndex: number
}

export type Action = ActionMove | ActionOpenDeck | ActionFlipCard
