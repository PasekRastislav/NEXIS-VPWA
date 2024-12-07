/*
|--------------------------------------------------------------------------
| Websocket events
|--------------------------------------------------------------------------
|
| This file is dedicated for defining websocket namespaces and event handlers.
|
*/

import Ws from '@ioc:Ruby184/Socket.IO/Ws'
Ws.namespace('/').on('loadChannels', 'MessageController.loadChannels')

Ws.namespace('/activity')
  .connected('ActivityController.onConnected')
  .disconnected('ActivityController.onDisconnected')

// this is dynamic namespace, in controller methods we can use params.name
Ws.namespace('channels/:name')
  // .middleware('channel') // check if user can join given channel
  .on('loadMessages', 'MessageController.loadMessages')
  .on('addMessage', 'MessageController.addMessage')
  .on('listUsers', 'MessageController.listUsers')
  .on('joinChannel', 'MessageController.joinChannel')
  .on('leaveChannel', 'MessageController.leaveChannel')
  .on('checkAccess', 'MessageController.checkAccess')
  .on('checkAdmin', 'MessageController.checkAdmin')
  .on('inviteUser', 'MessageController.inviteUser')
  .on('revokeUser', 'MessageController.revokeUser')
  .on('kickUser', 'MessageController.kickUser')
