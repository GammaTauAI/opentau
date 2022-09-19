const employeeFreeTime = function(schedule) {
  const n = schedule.length
  const time = mergeSort(schedule, 0, n - 1)
  const free = []
  let end = time[0].end
  for(let i = 1; i < time.length; i++) {
    if(time[i].start > end) {
      free.push(new Interval(end, time[i].start))
    }
    end = Math.max(end, time[i].end)
  }
  return free
}
function mergeSort(schedule, l, r) {
  if(l === r) return schedule[l]
  const mid = l + ((r - l) >> 1)
  const left = mergeSort(schedule, l, mid)
  const right = mergeSort(schedule, mid + 1, r)
  return merge(left, right)
}
function merge(A, B) {
  const res = []
  const m = A.length, n = B.length
  let i = 0, j = 0
  while(i < m || j < n) {
    if(i === m) {
      res.push(B[j++])
    } else if(j === n) {
      res.push(A[i++])
    } else if(A[i].start < B[j].start) {
      res.push(A[i++])
    } else {
      res.push(B[j++])
    }
  }
  return res
}
const employeeFreeTime = function(schedule) {
  const intervals = []
  schedule.forEach(s => s.forEach(t => intervals.push(t)))
  intervals.sort((a, b) =>
    a.start !== b.start ? a.start - b.start : a.end - b.end
  )
  let i1 = intervals[0]
  const res = []
  for (let interval of intervals.slice(1)) {
    let i2 = interval
    if (i1.end >= i2.start) {
      i1.end = Math.max(i1.end, i2.end)
    } else {
      res.push(new Interval(i1.end, i2.start))
      i1 = i2
    }
  }
  return res
}
const employeeFreeTime = function (schedule) {
  const res = [], timeLine = []
  schedule.forEach(e => timeLine.push(...e))
  timeLine.sort((a, b) => a.start - b.start)
  let tmp = timeLine[0]
  for(let i = 1, n = timeLine.length; i < n; i++) {
    const el = timeLine[i]
    if(el.start > tmp.end) {
      res.push(new Interval(tmp.end, el.start))
      tmp = el
    } else {
      tmp = el.end > tmp.end ? el : tmp
    }
  }
  return res
}
var employeeFreeTime = function(schedule) {
  const arr = schedule.reduce((ac, e) => {
    ac.push(...e)
    return ac
  }, [])
  arr.sort((a, b) => a.start - b.start || b.end - a.end)
  const n = arr.length
  const res = []
  let end = arr[0].end
  for(let i = 1; i < n; i++) {
    const cur = arr[i]
    if(cur.start > end) {
      res.push(new Interval(end, cur.start))
    }
    end = Math.max(end, cur.end)
  }
  return res
};
