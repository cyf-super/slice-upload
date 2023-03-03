<script setup>
import HelloWorld from './components/HelloWorld.vue'
import { uploadFileApi, mergeChunksApi } from './utils/request'
import { ref } from 'vue'
import * as SparkMD5 from "spark-md5"
import Worker from './worker/calculateMD5'

console.log("SparkMD5 ", SparkMD5);

const currFile = ref()
const fileChunkList = ref([])

const uploadFile = async (e) => {
  const files = e.target.files
  console.log('file ', files);
  const formData = new FormData()
  formData.append("name", '文件名');
  // for (let i = 0; i < files.length; i++) {
  //   console.log(files[i]);
  //   formData.append('files', files[i])
  // }
  // const data = await uploadFileApi(formData)
  // console.log('data ', data);
  currFile.value = files[0]
  console.time('结束')
  console.time('计算hash')
  const fileChunkList = splitFile(currFile.value)
  const fileHash = await calculateHash(fileChunkList)
  // const { fileHash } = await getFileChunk(currFile.value)
  // console.log('fileHash ', fileHash);
  // console.timeEnd('计算hash')
  // uploadChunks(fileHash)
}

const calculateHash = (chunkList) => {
  return new Promise(resolve => {
    const worker = new Worker()
    worker.postMessage({chunkList})
    worker.onmessage = (e) => {
      const { md5 } = e.data
      resolve(md5)
    }
  })
}


const defaultSize = 5 * 1024 * 1024  // 5M

function splitFile(file, size = defaultSize) {
  const fileChunkList = []
  let curChunkIndex = 0
  while (curChunkIndex < file.size) {
    const chunk = File.prototype.slice.call(
      file,
      curChunkIndex,
      curChunkIndex + size)
    
    fileChunkList.push(chunk)
    curChunkIndex += size
  }
  return fileChunkList
}

const getFileChunk = (file, chunkSize = defaultSize) => {
  return new Promise((resolve) => {
    const blobSlice = File.prototype.slice
    let chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const sparkMd5 = new SparkMD5.ArrayBuffer()
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
      const chunk = blobSlice.call(file, start, end)   // 
      fileChunkList.value.push({ chunk, size: chunk.size, name: currFile.value.name })
      fileReader.readAsArrayBuffer(chunk);
    }
    loadNext()
  })
}

const uploadChunks = (fileHash) => {
  const requests = fileChunkList.value.map((item, index) => {
    const formData = new FormData()
    formData.append(`${currFile.value.name}-${fileHash}-${index}`, item.chunk)
    formData.append("filename", currFile.value.name)
    formData.append("hash", `${fileHash}-${index}`)
    formData.append('fileHash', fileHash)
    console.log('formData ', formData);
    return uploadFileApi(formData)
  })

  Promise.all(requests).then(() => {
    mergeChunksApi({ size: defaultSize, filename: currFile.value.name });
    console.timeEnd('结束')
  })
}
</script>

<template>
  <div>
    <input type="file" @change="uploadFile">
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
