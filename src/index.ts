import { init } from 'snabbdom'
import * as view from './view'
import * as core from './core'
import * as þ from './util'
import { Action } from './actions'

import eventListenersPatch from 'snabbdom/modules/eventlisteners'

const patch = init([
  eventListenersPatch,
])


const root = document.createElement('div')
document.body.append(root)

let game = core.generateGame(þ.shuffle(core.generateDeck()))
let tree = view.Game(game, react)
patch(root, tree)


function react (action: Action) {
  const newGame = core.react(game, action)
  const newTree = view.Game(newGame, react)
  patch(tree, newTree)
  console.log(game, newGame)
  game = newGame
  tree = newTree
}
