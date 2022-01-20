<script setup lang="ts">
  import { ref } from 'vue';
  import { ChunksFileUpload } from '@zly/chunks-file-upload';

  const precent = ref(0)
  let file:File;
  const cfu = new ChunksFileUpload({
    chunkSize: 512*1024,
    server: 'http://101.35.238.22:9080'
  });
  const sub = cfu.progress$.subscribe(message=>{
    if(file && message.filename===file.name){
      console.log(message);
      if(message.percent>precent.value){
        precent.value= message.percent
      }
    }
  })
  const fileName = ref('')
  const handleFileChange= (e:any)=>{
    if(e.target.files.length<=0){
      return;
    }
    file = e.target.files[0];
    precent.value =0;
    fileName.value = file.name;
  }

  const handleUploadClick=()=>{
    if(file){
      cfu.upload(file);
    }
  }
  const handlePause=()=>{
    if(file){
      cfu.pause(file)
    }
  }
  
</script>

<template>
  <input type="file" @change="handleFileChange">
  <br>
  <span> 文件名称：{{fileName}} </span>
  <br>
  <button @click="handleUploadClick">上传</button>
  <button @click="handlePause">暂停</button>
  <button @click="handleUploadClick">重新开始上传</button>
  <div>
    <h5>上传进度：</h5>
    <span>{{precent.toFixed(2)}}%</span>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
