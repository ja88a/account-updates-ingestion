/**
 * Binary / logarithmic search on a sorted array of numbers
 *
 * Time complexity is ***O(log(n))***. Space Complexity is ***O(1)***.
 *
 * @param nums the sorted array of numbers
 * @param target the researched number
 * @return the index where the target number was found, `-1` if not found
 */
export function binarySearch(nums: number[], target: number): number {
  let left: number = 0;
  let right: number = nums.length - 1;

  while (left <= right) {
    const mid: number = Math.floor((left + right) / 2);

    if (nums[mid] === target) return mid;

    if (target < nums[mid]) right = mid - 1;
    else left = mid + 1;
  }

  return -1;
}

/**
 * Search a position/index where to insert a value in a sorted array of numbers
 *
 * Given a sorted array and a target value, return the index if the target is found.
 * If not, return the index where it would be if it were inserted in order.
 *
 * It deals with a binary / logarithmic search.
 *
 * Time Complexity: ***O(log(n))***
 * Space Complexity: ***O(1)***
 *
 * @example
 * ```js
 * searchInsert([1,3,5,6], 5) // 2
 * searchInsert([1,3,5,6], 0) // 0
 * ```
 *
 * @param nums the sorted array of numbers
 * @param target the number which position for insertion is searched
 * @return the position where the number is to be inserted
 */
export function searchInsert(nums: number[], target: number): number {
  let pivot;
  let left = 0;
  let right = nums.length - 1;

  // complete a binary search
  while (left <= right) {
    // set pivot point half way between left and right
    pivot = Math.floor((left + right) / 2);

    // found target
    if (nums[pivot] === target) {
      return pivot;
    }
    // eliminate search space on the right
    else if (nums[pivot] > target) {
      right = pivot - 1;
    }
    // eliminate search space on the left
    else {
      left = pivot + 1;
    }
  }
  return left;
}
