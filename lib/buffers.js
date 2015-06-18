
import ts from './transducer_support'

function base() {
  return {
    unreleased: [],
    push(put) {
      this.unreleased.push(put)
    },
    shift() {
      return this.unreleased.shift()
    }
  }
}

function fixed(limit) {
  return {
    unreleased: [],
    released: [],
    release(put) {

      // handle transducer
      put.payload = ts.apply(this.xduce, put.payload)
      if (typeof put.payload === 'undefined') 
        return put.resolve(true)

      this.released.push(put)
      put.resolve(true)
    },
    push(put) {
      if (this.released.length === limit) {
        this.unreleased.push(put)
      } else {
        this.release(put)
      }
    },
    shift() {
      if (!this.released.length) return

      var next = this.released.shift()

      var waiting = this.unreleased.shift()
      if (waiting) this.release(waiting)

      return next
    }
  }
}

function dropping(limit) {
  return {
    released: [],
    push(put) {
      if (this.released.length < limit) {
        this.released.push(put)
      }
      put.resolve(true)
    },
    shift() {
      return this.released.shift()
    }
  }
}

function sliding(limit) {
  return {
    released: [],
    push(put) {
      if (this.released.length === limit) {
        this.released = this.released.slice(1).concat([ put ])
      } else {
        this.released.push(put)
      }
      put.resolve(true)
    },
    shift() {
      return this.released.shift()
    }
  }
}

export default { base, fixed, dropping, sliding }