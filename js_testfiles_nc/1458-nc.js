var printLinkedListInReverse = function(head) {
  dfs(head)  
  function dfs(node) {
    if(node.getNext() == null) {
      node.printValue()
      return
    }
    dfs(node.getNext())
    node.printValue()
  }
};
