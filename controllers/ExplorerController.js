var BigNumber = require('bignumber.js');
const commonf = require('../common/commonf');

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

module.exports = {
    getStyledBalance: function(addr, net, datas) {
        var balance_obj = new Object();
        var asset_symbols = [];
        var token_symbols = [];
        var tokens_obj = new Object();

        ////////////////////////////// assets symbols ////////////////////////////////
        datas.forEach(data => {
            if (!asset_symbols.includes(data.name))
            {
                asset_symbols.push(data.name);
            }
        });
        ////////////////////////////// assets ////////////////////////////////////////
        var assetObjs = new Object();
        datas.forEach(data => {
            if (!assetObjs[data.name]) {
                var assetObj = new Object();
                assetObj.balance = 0;
                assetObj.unspent = new Array();
                assetObj.spent = new Array();
                assetObj.assetId = data.asset.slice(2);

                assetObjs[data.name] = assetObj;
            }

            if (data.status == 'unspent')
            {
                assetObjs[data.name].balance += Number(data.value);

                var utxo = new Object();
                utxo.index = data.tx_out_index;
                utxo.txid = data.txid.slice(2);
                utxo.value = data.value;

                assetObjs[data.name].unspent.push(utxo);
            }
            else if (data.status == 'spent')
            {
                var stxo = new Object();
                stxo.index = data.tx_out_index;
                stxo.txid = data.txid.slice(2);
                stxo.value = data.value;

                assetObjs[data.name].spent.push(stxo); 
            }
        });

        ////////////////////////////// tokens symbols ////////////////////////////////

        ////////////////////////////// tokens ////////////////////////////////////////

        balance_obj.assets = assetObjs;
        balance_obj.assetSymbols = asset_symbols;
        balance_obj.tokenSymbols = token_symbols;
        balance_obj.tokens = tokens_obj;
        balance_obj.address = addr;
        balance_obj.net = net;
        
        return balance_obj;
    },
    getStyledBlock: function(block) {
        // *** block sample ***
        // { "hash":"0x1ea29c180b9805f0894a7085d167f2631db60f16306e85c2537410bf7e34d612",
        //   "miner":"0x406ef87e1e51ad991351d4512ed1aaa1977ee6fb",
        //   "gasLimit":"4,712,388 m/s",
        //   "gasUsed":"0 m/s",
        //   "nonce":"0x85154c0a13a8f7a9",
        //   "difficulty":"0.000 T",
        //   "number":37725,
        //   "parentHash":"0x9d5656ad0e765e4befc1698bf4e90ccd872fdf47b353d2d5bd27becfe121f315",
        //   "uncledata":"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
        //   "rootHash":"0x611971dc5ff819a353f35119e944c06b009e7ae39b331b0324ec5cad3510eb62",
        //   "blockNumber":37725,
        //   "timestamp":"Thu, 02 Mar 2017 01:19:46 GMT",
        //   "extraData":"d783010500844765746885676f312e378777696e646f7773",
        //   "dataFromHex":"×\u0001\u0005\u0000Gethgo1.7windows",
        //   "size":537,
        //   "firstBlock":false,
        //   "lastBlock":false
        // }

        var result = {};

        result.number = block.number;
        result.transactions = block.transactions;
        result.size = block.size;
        result.timestamp = new Date(block.timestamp * 1000).toLocaleDateString();
        var hour = new Date(block.timestamp * 1000).getHours();
        var min = new Date(block.timestamp * 1000).getMinutes();
        var sec = new Date(block.timestamp * 1000).getSeconds();
        result.timestamp = result.timestamp + " " + hour + ":" + min + ":" + sec;
        result.difficulty = block.difficulty;// / 1000000000000;

        if(block.hash!==undefined){
            result.hash = block.hash;
        }
        else{
            result.hash ='pending';
        }
        if(block.miner!==undefined){
            result.miner = block.miner;
        }
        else{
            result.miner ='pending';
        }
        result.nonce = block.nonce;

        result.gasLimit = block.acf_limit;
        result.gasUsed = block.acf_used;

        //var diff = ("" + block.difficulty).replace(/['"]+/g, '') / 1000000000000;
        //diff.toFixed(3) + " T";
        return result;
    },

    getStyledBlocks: function (blocks) {
        var result = [];
        for (var i in blocks) {
            result.push(this.getStyledBlock(blocks[i]));
        }
        return result;
    },

    getStyledTx: function (transaction) {
        // *** transaction sample ***
        // { blockHash: '0xde7917f4e8a4c5fb9906a644c6b291bd9b126e2c90c12d2d5b11c3f5e4558653',
        //     blockNumber: 36458,
        //     from: '0x406ef87e1e51ad991351d4512ed1aaa1977ee6fb',
        //     gas: 90000,
        //     gasPrice: { [String: '20000000000'] s: 1, e: 10, c: [Object] },
        //     hash: '0xd274123995804992e3cc03b4dc7eddffbb5391dd6da2251e960e71d6de69df31',
        //         input: '0x',
        //     nonce: 7,
        //     to: '0xd662ad65d0f51d3225998ae5bbcdaa983fcd6bd9',
        //     transactionIndex: 0,
        //     value: { [String: '1000000000000000000'] s: 1, e: 18, c: [Object] } }

        var result = {};
        result.hash = transaction.hash;
        result.block_number = transaction.block_number;
        result.timestamp = new Date(transaction.timestamp * 1000).toLocaleDateString();
        var hour = new Date(transaction.timestamp * 1000).getHours();
        var min = new Date(transaction.timestamp * 1000).getMinutes();
        var sec = new Date(transaction.timestamp * 1000).getSeconds();
        result.timestamp = result.timestamp + " " + hour + ":" + min + ":" + sec;
        result.from_addr = transaction.from_addr;
        result.to_addr = transaction.to_addr;
        result.value = transaction.value;
        result.acf_used = transaction.acf_used;
        result.acf_price = transaction.acf_price;
        result.nonce = transaction.nonce;

        return result;
    },

    getStyledTxs: function (txs) {
        var result = [];
        for (var i in txs) {
            result.push(this.getStyledTx(txs[i]));
        }
        return result;
    },

    getStyledAccount: function (account) {
        var result = account;
        return account;
    },

    getStyledAccounts: function (accounts) {
        var result = [];
        for (var i in accounts) {
            result.push(this.getStyledAccount(accounts[i]));
        }
        return result;
    }
};