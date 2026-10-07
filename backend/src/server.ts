import app from './app'
import envConfig from './config/env'

app.listen(envConfig.PORT, () => {
  console.log(`Server đang chạy: http://localhost:${envConfig.PORT}`)
})
