import * as SparkMD5 from 'spark-md5'

self.onmessage = (e) => {
  const { chunkList } = e.data

  const spark = new SparkMD5.ArrayBuffer()
  let count = 0
  let percentage = 0
  const calculateMd5 = (index) => {
    const reader = new FileReader()
    reader.readAsArrayBuffer(chunkList[index])
    reader.onload = e => {
      count++
      spark.append(e.target?.result)
      // 计算完毕
      if (count >= chunkList.length) {
        const md5 = spark.end()
        console.log('11 ', md5)
        self.postMessage({
          percentage: 100,
          md5
        })
      } else {
        percentage += 100 / chunkList.length
        // self.postMessage({
        //   percentage
        // })
        calculateMd5(count)
      }
    }
  }
  calculateMd5(0)
}