var FoodRatings = function(foods, cuisines, ratings) {
    let n = foods.length, cm = new Map(), fm = new Map();     for (let i = 0; i < n; i++) {
        fm.set(foods[i], [cuisines[i], ratings[i]]);
        if (!cm.has(cuisines[i])) {
            let pq = new MaxPriorityQueue({
                compare: (x, y) => {
                    if (x[0] != y[0]) return y[0] - x[0];                     return x[1].localeCompare(y[1]);                 }
            });
            cm.set(cuisines[i], pq);
        }
        cm.get(cuisines[i]).enqueue([ratings[i], foods[i]])
    }
    return { changeRating, highestRated }
    function changeRating(food, newRating) {
        let cur = fm.get(food), cuisine = cur[0];
        cur[1] = newRating;
        fm.set(food, cur);
        cm.get(cuisine).enqueue([newRating, food]);
    }
    function highestRated(cuisine) {
        let pq = cm.get(cuisine);
        while (fm.get(pq.front()[1])[1] != pq.front()[0]) pq.dequeue();         return pq.front()[1];
    }
};
