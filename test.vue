<template>
  <div class="container" @click="click" v-bind:id="msg.length>2?'nihao':'wocao'">
    <div v-if="number>1">{{ name }}</div>
  </div>
</template>

<script>
let abc = 1
export default {
  name: "test",
  data() {
    return {
      name: "test",
      abc,
      msg: "Welcome to Your Vue.js App",
    };
  },
  methods: {
    click() {
      console.log("click");
    },
  },
};
</script>

<style lang="scss">
.container{flex-direction:column;height:100%}.container,.header{display:flex;width:100%}.header{align-items:center;background-color:red;height:50px;justify-content:center}#title{color:#fff;font-size:20px}.main{flex-direction:column;height:100%}.def,.main{display:flex;width:100%}.def{align-items:center;background-color:#0f0;height:50%;justify-content:center}#def{color:#fff;font-size:20px}.mark{align-items:center;background-color:#00f;display:flex;height:50%;justify-content:center;width:100%}#mark{color:#fff;font-size:20px}.footer{align-items:center;background-color:#f0f;display:flex;height:50px;justify-content:center;width:100%}#footer{color:#fff;font-size:20px}
</style>
