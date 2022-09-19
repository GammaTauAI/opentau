






const Bank = function(balance) {
  this.n = balance.length
  balance.unshift(0)
  this.b = balance
  
};







Bank.prototype.transfer = function(account1, account2, money) {
  let res = true
  if(account1 > this.n || account1 < 1) return false
  if(account2 > this.n || account2 < 1) return false
  if(this.b[account1]< money) return false
  this.b[account1] -= money
  this.b[account2] += money
  return true
};






Bank.prototype.deposit = function(account, money) {
  if(account > this.n || account < 1) return false
  this.b[account] += money
  return true
};






Bank.prototype.withdraw = function(account, money) {
  if(account > this.n || account < 1) return false
  if(this.b[account] < money) return false
  this.b[account] -= money
  return true
};









