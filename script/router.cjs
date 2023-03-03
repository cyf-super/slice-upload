const path = require('path')
const fs = require('fs')
const router = require('koa-router')()
const uuid = require('uuid')
const koaBody = require('koa-body')

// 设置文件上传目录
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 设置分片存储目录
// const chunkDir = path.join(uploadDir, 'chunks');
// if (!fs.existsSync(chunkDir)) {
//   fs.mkdirSync(chunkDir);
// }

const multer = require('multer')

const upload = multer({
	dest: './uploads'
})


// router.post('/upload-file', upload.array('files'), (req, res) => {
// 	console.log('body', req.files)
// 	res.status(200).send({ msg: '已经收到' })
// })
const outputPath = path.resolve(__dirname, 'uploads')
let currChunk = {}; // 当前 chunk 信息
// const bodyParse = 

router.post(
	'/upload-file',
	koaBody({
		multipart: true,
		formidable: {
      uploadDir: outputPath,
			onFileBegin: (name, file) => {
				console.log('name, file ', name, file)
				const [filename, fileHash, index] = name.split('-')
				const dir = path.join(outputPath, filename)
				console.log('dir=---> ', dir)
				// 保存当前 chunk 信息，发生错误时进行返回
				currChunk = {
					filename,
					fileHash,
					index
				}

				// 检查文件夹是否存在如果不存在则新建文件夹
				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir)
				}

				// 覆盖文件存放的完整路径
				file.path = `${dir}/${fileHash}-${index}`
			},
      onError: (error) => {
        app.status = 400
        app.body = { code: 400, msg: '上传失败', data: currChunk }
        return
		  }
		},
	}),
	async (ctx) => {
		ctx.body = JSON.stringify({
			code: 2000,
			message: 'upload successfully！'
		})
	}
)

// 合并请求
router.post('/merge-chunk', async (ctx) => {
	const { filename, size } = ctx.request.body
	// 合并 chunks
	await mergeFileChunk(path.join(outputPath, '_' + filename), filename, size)

	// 处理响应
	ctx.set('Content-Type', 'application/json')
	ctx.body = JSON.stringify({
		data: {
			code: 2000,
			filename,
			size
		},
		message: 'merge chunks successful！'
	})
})

// 通过管道处理流 
const pipeStream = (path, writeStream) => {
  return new Promise(resolve => {
    const readStream = fs.createReadStream(path);
    readStream.pipe(writeStream);
    readStream.on("end", () => {
      fs.unlinkSync(path);
      resolve();
    });
  });
}

const mergeFileChunk = async (filePath, filename, size) => {
	const chunkDir = path.join(outputPath, filename)
  console.log('chunkDir ', chunkDir)
	const chunkPaths = fs.readdirSync(chunkDir)

  console.log('chunkPaths ', chunkPaths)

	if (!chunkPaths.length) return

	// 根据切片下标进行排序，否则直接读取目录的获得的顺序可能会错乱
	chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1])
	console.log('chunkPaths = ', chunkPaths)

	await Promise.all(
		chunkPaths.map((chunkPath, index) =>
			pipeStream(
				path.resolve(chunkDir, chunkPath),
				// 指定位置创建可写流
				fs.createWriteStream(filePath, {
					start: index * size,
					end: (index + 1) * size
				})
			)
		)
	)

	// 合并后删除保存切片的目录
	fs.rmdirSync(chunkDir)
}

module.exports = {
	router,
	koaBody
}