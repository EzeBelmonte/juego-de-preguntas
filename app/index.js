// app/index.js
import express from 'express'
import homeRoutes from './routes/home.js'
import gameRoutes from './routes/game.js'

const router = express.Router()

router.use('/', homeRoutes)
router.use('/game', gameRoutes)

export default router
