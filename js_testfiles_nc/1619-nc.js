const isValid = function (code) {
  const stack = []
  const [A, Z] = ['A', 'Z'].map((e) => e.charCodeAt(0))
  for (let i = 0; i < code.length; ) {
    if (i > 0 && stack.length === 0) return false
    if (code.startsWith('<![CDATA[', i)) {
      let j = i + 9
      i = code.indexOf(']]>', j)
      if (i < 0) return false
      i += 3
    } else if (code.startsWith('</', i)) {
      let j = i + 2
      i = code.indexOf('>', j)
      if (i < 0 || i === j || i - j > 9) return false
      for (let k = j; k < i; k++) {
        if (
          code.charAt(k) !== code[k].toUpperCase() ||
          !(code.charCodeAt(k) >= A && code.charCodeAt(k) <= Z)
        )
          return false
      }
      let s = code.slice(j, i++)
      if (stack.length === 0 || stack.pop() !== s) return false
    } else if (code.startsWith('<', i)) {
      let j = i + 1
      i = code.indexOf('>', j)
      if (i < 0 || i === j || i - j > 9) return false
      for (let k = j; k < i; k++) {
        if (
          code.charAt(k) !== code[k].toUpperCase() ||
          !(code.charCodeAt(k) >= A && code.charCodeAt(k) <= Z)
        )
          return false
      }
      let s = code.slice(j, i++)
      stack.push(s)
    } else {
      i++
    }
  }
  return stack.length === 0
}
const isValid = function (code) {
  code = code.replace(/<!\[CDATA\[.*?\]\]>|t/g, '-')
  let prev
  while (code !== prev) {
    prev = code
    code = code.replace(/<([A-Z]{1,9})>[^<]*<\/\1>/g, 't')
  }
  return code === 't'
}
const isValid = function (code) {
  const STATES = {
    lt: 1,     tagOrData: 2,     tagName: 3,     dataContent: 4,     dataEnd: 5,     tagContent: 6,   }
  class Validator {
    constructor(str) {
      this.state = STATES.lt
      this.str = str
      this.stack = []
      this.i = 0
            this.isValid = this.isUpperCase(this.str[1])
            while (this.isValid && this.i < this.str.length) {
        this.isValid = this.validate()
      }
            this.isValid = this.isValid && !this.stack.length
    }
    validate() {
      let char = this.str[this.i]
      switch (this.state) {
                case STATES.lt:
          this.i++
          if (char == '<') {
            this.state = STATES.tagOrData
            return true
          }
          return false
                case STATES.tagOrData:
                    if (char == '!') {
            this.i = this.findStrEnd(this.i + 1, '[CDATA[')
            if (this.i == -1) {
              return false
            }
            this.state = STATES.dataContent
            return true
          }
                    if (char == '/') {
            let name = this.stack.pop()
            if (!name) {
              return false
            }
            this.i = this.findStrEnd(this.i + 1, name + '>')
            if (this.i == -1) {
              return false
            }
            if (!this.stack.length & (this.i < this.str.length)) {
                            return false
            }
            this.state = STATES.tagContent
            return true
          }
                    {
            let name = this.findTagName(this.i)
            if (!name) {
              return false
            }
            if (name.length > 9) {
              return false
            }
            this.i += name.length + 1
            this.stack.push(name)
            this.state = STATES.tagContent
            return true
          }
        case STATES.dataContent:         {
          let end = this.findStrEnd(this.i, ']]>')
          if (end != -1) {
                        this.i = end
            this.state = STATES.tagContent
            return true
          }
                    this.i++
          return true
        }
        case STATES.tagContent:
          if (char == '<') {
            this.state = STATES.tagOrData
            this.i++
            return true
          }
          this.i++
          return true
      }
    }
    isUpperCase(char) {
      return /[A-Z]/.test(char)
    }
    findStrEnd(from, toFind = '') {
      let end = from + toFind.length
      for (let i = 0; i < toFind.length; i++) {
        if (toFind[i] != this.str[i + from]) return -1
      }
      return end
    }
    findTagName(from) {
      let tagName = ''
      for (let i = from; i < this.str.length; i++) {
        if (this.isUpperCase(this.str[i])) {
          tagName += this.str[i]
          continue
        }
        if (this.str[i] == '>') {
          return tagName
        }
        return ''
      }
      return ''
    }
  }
  let v = new Validator(code)
  return v.isValid
}
