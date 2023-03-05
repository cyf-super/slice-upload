<script setup>
import { uploadFileApi, mergeChunksApi } from './utils/request';
import Worker from './worker/calculateMD5.js?worker';

const uploadFile = async e => {
  const file = e.target.files[0];
  console.time('上传结束');
  const fileChunkList = sliceFile(file);
  calculateHash(fileChunkList).then(hash => {
    uploadChunks(hash, file, fileChunkList);
  });
};

const calculateHash = chunkList => {
  return new Promise(resolve => {
    const worker = new Worker();
    worker.postMessage({ chunkList });
    worker.onmessage = e => {
      const { md5 } = e.data;
      resolve(md5);
    };
  });
};

const defaultSize = 5 * 1024 * 1024; // 5M

function sliceFile(file, size = defaultSize) {
  const fileChunkList = [];
  let curChunkIndex = 0;
  while (curChunkIndex < file.size) {
    const chunk = File.prototype.slice.call(
      file,
      curChunkIndex,
      curChunkIndex + size
    );

    fileChunkList.push(chunk);
    curChunkIndex += size;
  }
  return fileChunkList;
}

/**
 * 上传切片并合并切片
 * @param {*} fileHash 文件的md5
 * @param {*} file 文件
 * @param {*} fileChunkList 切片数组
 */
const uploadChunks = (fileHash, file, fileChunkList) => {
  const requests = fileChunkList.map((item, index) => {
    const formData = new FormData();
    formData.append(`${file.name}-${fileHash}-${index}`, item);
    return uploadFileApi(formData);
  });

  Promise.all(requests).then(() => {
    mergeChunksApi({ size: defaultSize, filename: file.name });
    console.timeEnd('上传结束');
  });
};
</script>

<template>
  <div>
    <input type="file" @change="uploadFile" />
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
