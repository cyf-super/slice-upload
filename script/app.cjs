const Koa = require('koa')
const cors = require('koa2-cors')
const { router, koaBody } = require('./router.cjs')

const app = new Koa()

const corsOptions = {
	origin: 'http://127.0.0.1:5173/',
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization'], // 设置允许的请求头
	optionsSuccessStatus: 200 // 设置响应的状态码
}

app.use(cors())
app.use(koaBody({}))

app.use(router.routes(), router.allowedMethods())

const port = 3002
app.listen(port, () => {
	console.log(`start server: http://localhost:${port}`)
})
