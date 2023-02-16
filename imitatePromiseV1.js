class Promise {
  // 构造方法
  constructor(executor) {
    // 添加属性
    this.PromiseState = "pending";
    this.PromiseResult = null;

    this.callbacks = [];

    // 保存实例对象的 this 的值
    const self = this; // self, _this, that

    //   resolve 函数
    function resolve(data) {
      // 判断状态，防止二次改变状态
      if (self.PromiseState !== "pending") return;
      // 1.修改对象的状态
      self.PromiseState = "fulfilled";
      // 2.设置对象结果值
      self.PromiseResult = data;

      // 调用成功回调函数
      setTimeout(() => {
        self.callbacks.forEach((item) => {
          item.onResolved(data);
        });
      });
    }

    //   reject 函数
    function reject(data) {
      if (self.PromiseState !== "pending") return;
      self.PromiseState = "rejected";
      self.PromiseResult = data;
      setTimeout(() => {
        self.callbacks.forEach((item) => {
          item.onRejected(data);
        });
      });
    }

    try {
      // 同步调用执行器函数
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // then 方法封装
  then(onResolved, onRejected) {
    const self = this;
    // 判断回调函数参数
    // 当没有传递 onRejected 参数时
    if (typeof onRejected !== "function") {
      onRejected = (reason) => {
        throw reason;
      };
    }
    // 当没有传递 onResolved 参数时
    if (typeof onResolved !== "function") {
      onRejected = (value) => value;
      // 等同于：value => {return value};
    }
    return new Promise((resolve, reject) => {
      // 封装函数
      function callback(type) {
        try {
          // 获取回调函数执行结果
          let result = type(self.PromiseResult);
          if (result instanceof Promise) {
            result.then(
              (value) => {
                resolve(value);
              },
              (reason) => {
                reject(reason);
              }
            );
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      }
      if (this.PromiseState === "fulfilled") {
        setTimeout(() => {
          callback(onResolved);
        });
      }
      if (this.PromiseState === "rejected") {
        setTimeout(() => {
          callback(onRejected);
        });
      }
      if (this.PromiseState === "pending") {
        // 出现多个 then 时，保存回调函数
        this.callbacks.push({
          onResolved: function () {
            callback(onResolved);
          },
          onRejected: function () {
            callback(onRejected);
          },
        });
      }
    });
  }

  // catch 方法
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  //添加 resolve 方法，因为它属于类，不属于实例对象，所以要static声明为静态成员
  // 1，如果参数是 Promise 实例，状态取决于传入的 Promise 成功/失败 状态；
  // 2，如果参数是非 Promise 实例，则返回状态为成功，结果为传入的参数值；
  static resolve(value) {
    return new Promise((resolve, reject) => {
      if (value instanceof Promise) {
        value.then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            reject(reason);
          }
        );
      } else {
        resolve(value);
      }
    });
  }

  // 添加 reject 方法
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  // 添加 all 方法，只有当传入的所有 Promise 为成功时状态为成功，按顺序返回 Promise 数组，否则返回失败的 Promise
  static all(Promises) {
    return new Promise((resolve, reject) => {
      // 统计 Promise 成功的数量
      let count = 0;
      // 保存 Promise
      let arr = [];
      for (let i = 0; i < Promises.length; i++) {
        Promises[i].then(
          (value) => {
            // 说明当前 Promise 状态是成功
            count++;
            // 不使用 arr.push 是为了保证输出顺序对应一致
            arr[i] = value;
            if (count === Promises.length) {
              resolve(arr);
            }
          },
          (reason) => {
            reject(reason);
          }
        );
      }
    });
  }

  // 添加 race 方法，Promise 状态由“最先改变状态”的 Promise 决定
  static race(Promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < Promises.length; i++) {
        Promises[i].then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            reject(reason);
          }
        );
      }
    });
  }
}
