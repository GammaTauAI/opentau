








const minimumTimeRequired = function(jobs, k) {
  const workers = Array(k).fill(0)
  let res = Infinity
  const n = jobs.length

  dfs(0)
  
  return res

  function dfs(idx) {
    if(idx === n) {
      res = Math.min(res, Math.max(...workers))
      return
    }
    const visited = new Set()
    const e = jobs[idx]
    for(let i = 0; i < k; i++) {
      if(visited.has(workers[i])) continue
      if(workers[i] + e >= res) continue
      visited.add(workers[i])
      workers[i] += e
      dfs(idx + 1)
      workers[i] -= e
      if(workers[i] === 0) break
    }
  }
};

// another






const minimumTimeRequired = function (jobs, k) {
  if (jobs.length <= k) {
    return Math.max(...jobs)
  }

  // create a store to hold the number of hours each worker worked
  const workers = new Array(k).fill(0)

  let minLongestWorkingTime = Infinity
  const dfs = (i) => {
    if (i === jobs.length) {
      // if we assigned all the jobs, see if we have a better result
      minLongestWorkingTime = Math.min(
        minLongestWorkingTime,
        Math.max(...workers)
      )
      return
    }
    const lengthOfWork = jobs[i]

    for (let worker = 0; worker < k; worker++) {
      workers[worker] += lengthOfWork

      // if this combination is has a chance of decreasing our
      // answer, try it, otherwise skip it to save on time.
      if (workers[worker] <= minLongestWorkingTime) {
        dfs(i + 1)
      }
      workers[worker] -= lengthOfWork

      // We want to minimize the width of the tree
      // so if the worker has gotten their first job
      // don't try any workers after this worker.
      // All other workers after this worker will be 0 as well
      // so the combination is exactly the same.
      if (workers[worker] === 0) break
    }
  }

  dfs(0)
  return minLongestWorkingTime
}

// another






const minimumTimeRequired = function(jobs, k) {
  return solution(jobs, k)
};

function solution(jobs, k) {
  const n = jobs.length
  let res = Infinity, arr = Array(k).fill(0)

  let start = 0
  bt(0)
  return res

  function bt(idx) {
   start++
   if(idx === n) {
     res = Math.min(res, Math.max(...arr))
     return
   }
   const visited = new Set()
   for(let j = start; j < start + k; j++) {
     const i = j % k
     if(visited.has(arr[i])) continue
     if(arr[i] + jobs[idx] > res) continue
     visited.add(arr[i])
     arr[i] += jobs[idx]
     bt(idx + 1)
     arr[i] -= jobs[idx]
   }
  } 
}

