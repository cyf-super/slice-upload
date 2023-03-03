const SparkMD5 = require('spark-md5')

const defaultSize = 5 * 1024 * 1024  // 5M

const getFileChunk = (file, arr = [], chunkSize = defaultSize) => {
  return Promise((resolve) => {
    const blobSlice = File.prototype.slice
    let chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const sparkMd5 = new SparkMD5()
    const fileReader = new FileReader()

    fileReader.onload = (e) => {
      console.log('read chunk nr', currentChunk + 1, 'of')

      const chunk = e.target.result
      sparkMd5.append(chunk)
      currentChunk++

      if (currentChunk < chunks) {
        loadNext()
      } else {
        const fileHash = sparkMd5.end()
        console.info('finished computed hash', fileHash)
        resolve({ fileHash })
      }
    }

    fileReader.onerror = () => {
      console.warn('oops, something went wrong.')
    }
    function loadNext() {
      const start = currentChunk * chunkSize
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize
      const chunk = blobSlice.call(file, start, end)
      arr.push({ chunk, size: chunk.size, name: currFile.value.name })
    }
  })

}