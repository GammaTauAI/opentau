from typing import List


def twoSum(self, nums: List[int], target: int) -> List[int]:
    nums_index = [(v, index) for index, v in enumerate(nums)]
    nums_index.sort()
    begin, end = 0, len(nums) - 1
    while begin < end:
        curr = nums_index[begin][0] + nums_index[end][0]
        if curr == target:
            return [nums_index[begin][1], nums_index[end][1]]
        elif curr < target:
            begin += 1
        else:
            end -= 1

    return [0, 0]
