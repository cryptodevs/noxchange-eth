const express = require('express')
const app = express()

var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new Web3.providers.WebsocketProvider('ws://localhost:8546'));

const entropy = 'YOLO'
web3.eth.accounts.wallet.clear()
web3.eth.accounts.wallet.create(0, entropy)

let S = {}

app.get('/new-tx', (req, res) => {
  let account = web3.eth.accounts.create()
  web3.eth.accounts.wallet.add(account)
  let buyerAddress = req.query.buyerAddress
  let qty = web3.utils.toWei(req.query.qty)
  let id = req.query.id
  let o = {
    id,
    address: account.address,
    buyerAddress,
    qty,
    U1: 'nico',
    U2: 'joaco',
    state: 'WAITING_FOR_BALANCE',
    rate: 'XX',
  }
  S[o.id] = o
  console.log('added to S', o)
  res.send({'adress': account.address})
})

// watch last txs to chek for our balances
var subscription = web3.eth.subscribe('newBlockHeaders', function(error, result) {
    if (error) {
      console.log(error)
      return
    }
    for (let id in S) {
      let o = S[id]
      if (o.state === 'WAITING_FOR_BALANCE') {
        web3.eth.getBalance(o.address, (e, balance) => {
          if (error) {
            console.log(error);
            return
          }
          console.log('CHECK BALANCE', o.address, balance)
          if (balance  >= o.qty) {
            S[o.id]['state'] = 'BALANCE_OK'
            console.log('BALANCE_OK', o)
          }
        })
      }
    }
})

app.get('/send-coins', (req, res) => {
  let id = req.query.id
  let o = S[id]
  if (o.state === 'BALANCE_OK') {
    let tx = {from: o.address,
              to: o.buyerAddress,
              value: o.qty,
              gas: 1000000,
              chainId: 15,
             }
    web3.eth.sendTransaction(tx, function(error, txHash) {
      if (error) {
        console.log(error);
        return
      }
      res.send({ txHash })
      console.log('TXHASH', txHash);
    }).then(console.log).catch((e, r) => console.log('sendTransaction', e, r))
    o['state'] = 'SENT'
    S[o.id] = o
  }
})

app.listen(3009, () => console.log('➡ http://localhost:3009/'))
