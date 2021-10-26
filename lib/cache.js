const setTimeout = typeof process !== 'undefined' ? require('timers').setTimeout : window.setTimeout;

// A cache that expires.
module.exports = class Cache extends Map {
  constructor(timeout = 1000) {
    super();
    this.timeout = timeout;
  }
  set(key, value) {
    if (this.has(key)) {
      clearTimeout(super.get(key).tid);
    }
    const timeout = setTimeout(this.delete.bind(this, key), this.timeout).unref()
    super.set(key, {
      tid: typeof process !== 'undefined' ? timeout.unref() : timeout,
      value,
    });
  }
  get(key) {
    let entry = super.get(key);
    if (entry) {
      return entry.value;
    }
    return null;
  }
  getOrSet(key, fn) {
    if (this.has(key)) {
      return this.get(key);
    } else {
      let value = fn();
      this.set(key, value);
      (async () => {
        try {
          await value;
        } catch (err) {
          this.delete(key);
        }
      })();
      return value;
    }
  }
  delete(key) {
    let entry = super.get(key);
    if (entry) {
      clearTimeout(entry.tid);
      super.delete(key);
    }
  }
  clear() {
    for (let entry of this.values()) {
      clearTimeout(entry.tid);
    }
    super.clear();
  }
};