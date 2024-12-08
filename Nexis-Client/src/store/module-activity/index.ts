// src/store/module-activity/index.ts
import { Module } from 'vuex'
import { StateInterface } from '../index'
import state, { ActivityStateInterface } from './state'
import getters from './getters'
// import actions from './actions'
import mutations from './mutations'

const activityModule: Module<ActivityStateInterface, StateInterface> = {
  namespaced: true,
  // actions,
  getters,
  mutations,
  state
}

export default activityModule
