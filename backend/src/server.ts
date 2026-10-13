import app from './app'
import envConfig from './config/env'
import { startWorkers } from './queues/workers'

app.listen(envConfig.PORT, () => {
  console.log(`Server đang chạy: http://localhost:${envConfig.PORT}`)
})

// Dev: chạy worker chung process với server cho tiện (RUN_WORKER=true, mặc định).
// Deploy: đặt RUN_WORKER=false rồi chạy npm run worker ở process riêng
if (envConfig.RUN_WORKER) {
  startWorkers().catch((error) => console.error('Không khởi động được worker:', error))
}
