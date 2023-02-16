// Promise 参数是一个函数并且传入后会自动执行
class Commitment {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";
  constructor(func) {
    this.status = Commitment.PENDING; // 初始待定状态
    this.result = null; // 保存调用 resolve, reject 时传递的值
    this.resolveCallbacks = [];
    this.rejectCallbacks = [];

    // 捕获直接 throw 抛出错误时情况
    try {
      /**
       * 添加 this 调用类自身的resolve, reject 方法;
       * bind 给实例的 resolve 方法绑定这个 this 为当前的实例对象
       */
      func(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      // 不需要 bind 因为是直接执行, 而不是创建实例后再执行
      this.reject(error);
    }
  }
  resolve(result) {
    setTimeout(() => {
      if (this.status === Commitment.PENDING) {
        this.status = Commitment.FULFILLED;
        this.result = result;
        this.resolveCallbacks.forEach((callback) => {
          callback(result);
        });
      }
    });
  }
  reject(result) {
    setTimeout(() => {
      if (this.status === Commitment.PENDING) {
        this.status = Commitment.REJECTED;
        this.result = result;
        this.rejectCallbacks.forEach((callback) => {
          callback(result);
        });
      }
    });
  }
  /**
   * then 方法接收两个参数，一个成功时调用，另一个失败时调用
   * 如果没有传入某一个函数参数，则默认为空函数
   */
  then(onFULFILLED, onREJECTED) {
    return new Commitment((resolve, reject) => {
      onFULFILLED = typeof onFULFILLED === "function" ? onFULFILLED : () => {};
      onREJECTED = typeof onREJECTED === "function" ? onREJECTED : () => {};
      if (this.status === Commitment.PENDING) {
        this.resolveCallbacks.push(onFULFILLED);
        this.rejectCallbacks.push(onREJECTED);
      }
      if (this.status === Commitment.FULFILLED) {
        setTimeout(() => {
          onFULFILLED(this.result);
        });
      }
      if (this.status === Commitment.REJECTED) {
        setTimeout(() => {
          onREJECTED(this.result);
        });
      }
    });
  }
}

/**
 * 1. 输出 '第一步'
 * 2. new 实例
 * 3. 输出 '第二步'
 * 4. setTimeout 异步操作，先执行 then 方法
 * 5. 发现当前为 pending 状态，将函数参数放到数组里保存
 * 6. 输出 '第三步'
 * 7. 开始回头执行 setTimeout, 发现 resolve 又要 setTimeout 异步处理
 * 8. 输出 '第四步'
 * 9. 执行 resolve, 改变状态、改变结果值, 遍历保存的数组对象，执行保存的函数对象
 * 10. 输出 '这次一定' (同理之后输出 '下次一定')
 */

console.log("第一步");
let commitment = new Commitment((resolve, reject) => {
  console.log("第二步");
  setTimeout(() => {
    resolve("这次一定");
    reject("下次一定");
    console.log("第四步");
  });
});
commitment
  .then(
    (resolve) => {
      console.log(resolve);
    },
    (reject) => {
      console.log(reject);
    }
  )
  // 链式调用，要让 then 方法返回一个新的 Promise
  .then(
    (resolve) => {
      console.log(resolve);
    },
    (reject) => {
      console.log(reject);
    }
  );
console.log("第三步");
