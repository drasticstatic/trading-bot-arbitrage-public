import { configureStore } from '@reduxjs/toolkit'
import botReducer from './botSlice'

export const store = configureStore({
  reducer: {
    bot: botReducer
  }
})

export default store

