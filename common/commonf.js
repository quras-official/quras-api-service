const defMaxBlocks = 20;
const defMaxTxs = 20;
const defMaxAccounts = 20;
const diffUnit = 10000000;

const QRS = '0x52a4b58d99af84e0ca33318f3724e92c14835d97af46714a4a68a098a3843276';
const QRG = '0x8bd1633c62cf7631490a95ec718d2ce80928cc3b9be186394086fc7ef0e35f6a';

module.exports = {
    getQRS: function(){
        return QRS;
    },
    getQRG: function(){
        return QRG;
    },
    getTransactionHistory: function(pool, async, addr, _callback) {
        async.waterfall([
            function getConn(callback) {
                pool.getConnection(function(err,conn) {
                    var connection = conn;
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection, addr);
                    }
                });
            },
            function getTxHistory(connection, addr, callback) {
                var likeAddr = '%' + addr + '%';
                var sql = "SELECT * from tx_history WHERE claim_transaction_address = ? OR contract_transaction_from = ? OR contract_transaction_to = ? OR invocation_transaction_address = ? OR issue_transaction_address = ? OR issue_transaction_to = ? OR miner_transaction_address = ? OR miner_transaction_to = ? OR uploadrequest_transaction_upload_address = ? OR downloadrequest_transaction_upload_address = ? OR downloadrequest_transaction_download_address = ? OR approvedownload_transaction_approve_address = ? OR approvedownload_transaction_download_address = ? OR payfile_transaction_download_address = ? OR payfile_transaction_upload_address = ?";
                connection.query(sql, [addr, addr, addr, addr, addr, addr, addr, addr, addr, addr, addr, addr, addr, addr, addr], function(err, rows) {
                    if (err) {
                        callback(err, connection);
                    } else {
                        if (rows.length > 0) {
                            callback(null, connection, rows);
                        } else {
                            callback("NOTHING", connection);
                        }
                    }
                });
            }
        ],
            function (err, connection, unspents)
            {
                if (connection) {
                    connection.release();
                }

                if (err) {
                    _callback(err, null);
                } else {
                    _callback(null, unspents);
                }
            }
        );
    },
    getRpcNodesInfo: function(pool, async, _callback) {
        async.waterfall([
            function getConn(callback) {
                pool.getConnection(function(err,conn) {
                    var connection = conn;
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection,);
                    }
                });
            },
            function getNodesList(connection, callback) {
                var sql = 'SELECT * FROM nodes';
                connection.query(sql, [], function(err, rows) {
                    if (err) {
                        callback(err, connection);
                    } else {
                        if (rows.length > 0) {
                            callback(null, connection, rows);
                        } else {
                            callback("NOTHING", connection);
                        }
                    }
                });
            }
        ],
            function (err, connection, nodes)
            {
                if (connection) {
                    connection.release();
                }

                if (err) {
                    _callback(err, null);
                } else {
                    _callback(null, nodes);
                }
            }
        );
    },
    getCurrentBlockHeight: function(pool, async, _callback) {
        async.waterfall([
            function getConn(callback) {
                pool.getConnection(function(err,conn) {
                    var connection = conn;
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection,);
                    }
                });
            },
            function getBlockHeight(connection, callback) {
                var sql = 'SELECT * FROM status WHERE id = 0';
                connection.query(sql, [], function(err, rows) {
                    if (err) {
                        callback(err, connection);
                    } else {
                        if (rows.length > 0) {
                            callback(null, connection, rows[0]["current_block_number"]);
                        } else {
                            callback("NOTHING", connection);
                        }
                    }
                });
            }
        ],
            function (err, connection, height)
            {
                if (connection) {
                    connection.release();
                }

                if (err) {
                    _callback(err, null);
                } else {
                    _callback(null, height);
                }
            }
        );
    },
    getUnspent: function(pool, async, addr, asset, _callback) {
        async.waterfall([
            function getConn(callback) {
                pool.getConnection(function(err,conn) {
                    var connection = conn;
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection, addr, asset);
                    }
                });
            },
            function getUnspentList(connection, addr, asset, callback) {
                if (asset == 'MOD')
                {
                    asset = MOD;
                }
                else if (asset == 'MODC')
                {
                    asset = MODC;
                }
                
                if (asset != undefined)
                {
                    var sql = 'SELECT * FROM utxos WHERE address = ? AND asset = ? AND status="unspent"';
                    connection.query(sql, [addr, asset], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            if (rows.length > 0) {
                                callback(null, connection, rows);
                            } else {
                                callback("NOTHING", connection);
                            }
                        }
                    });
                }
                else
                {
                    var sql = 'SELECT * FROM utxos WHERE address = ? AND status="unspent"';
                    connection.query(sql, [addr], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            if (rows.length > 0) {
                                callback(null, connection, rows);
                            } else {
                                callback("NOTHING", connection);
                            }
                        }
                    });
                }
            }
        ],
            function (err, connection, unspents)
            {
                if (connection) {
                    connection.release();
                }

                if (err) {
                    _callback(err, null);
                } else {
                    _callback(null, unspents);
                }
            }
        );
    },
    getTotals: function(pool, web3, async, _callback) {
        async.waterfall([
            function getConn(callback) {
                pool.getConnection(function(err,conn) {
                    var connection = conn;
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection);
                    }
                });
            },
            function getAccountCounts(connection, callback) {
                connection.query("SELECT COUNT(*) as nodeCount from accounts", function(err, rows) {
                    if (err) {
                        callback(err, connection);
                    }
                    var nodes = rows[0].nodeCount;
                    callback(null, connection, nodes);
                });
            },
            function getInform(connection, nodes, callback) {
                connection.query("SELECT * FROM block_number", function (err, rows) {
                    if (err) {
                        callback(err, connection);
                    }

                    var coins = rows[0].coins;
                    coins = Math.round(coins * 100) / 100;
                    var blocks = rows[0].number;
                    var difficulty = Math.round(rows[0].difficulty / diffUnit * 100) / 100;
                    callback(null, connection, coins, blocks, difficulty, nodes);
                });
            }
        ],
            function (err, connection, coins, blocks, difficulty, nodes)
            {
                if (connection) {
                    connection.release();
                }

                if (err) {
                    _callback(err, null);
                } else {
                    var totals = {};
                    totals.coins = coins;
                    totals.nodes = nodes;
                    totals.blocks = blocks;
                    totals.difficulty = difficulty;
                    _callback(null, totals);
                }
            }
        );
    },
    getVersion: function(pool, callback) {
        pool.getConnection(function(err, conn) {
            if (err) {
                callback(err, null);
            } else {
                conn.query("SELECT * FROM app_version", function (err, rows) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var versions = {};
                        versions.miner = rows[0].miner;
                        versions.wallet = rows[0].wallet;
                        versions.mobile = rows[0].mobile;
                        conn.release();
                        callback(null, versions);
                    }
                });
            }
        });
    },
    getRecentBlocks: function(pool, web3, async, _callback) {
        async.waterfall([
            function getConn(callback) {
                pool.getConnection(function(err,conn) {
                    var connection = conn;
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection);
                    }
                });
            },
            function getBlockNumber(connection, callback) {
                connection.query('SELECT COUNT(*) as blockCount from blocks', function (err, rows) {
                    if (err) {
                        callback(err, connection);
                    } else {
                        var maxBlocks = defMaxBlocks;
                        var blockNum = rows[0].blockCount;
                        if (maxBlocks > blockNum) {
                            maxBlocks = blockNum;
                        }
                        callback(null, connection, maxBlocks);
                    }
                });
            },
            function getBlocks(connection, maxBlocks, callback) {
                var sql = 'SELECT * FROM blocks ORDER BY id DESC LIMIT ?,?';
                connection.query(sql, [0, maxBlocks], function(err, rows) {
                    if (err) {
                        callback(err, connection);
                    } else {
                        callback(null, connection, rows);
                    }
                });
            }
        ],
            function (err, connection, blocks)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    _callback(null, blocks);
                }
            }
        );
    },

    getBlocksWithPage: function(pool, web3, page, async, _callback) {
        async.waterfall([
                function getConn(callback) {
                    pool.getConnection(function(err,conn) {
                        var connection = conn;
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection);
                        }
                    });
                },
                function getBlockNumber(connection, callback) {
                    connection.query('SELECT COUNT(*) as blockCount from blocks', function (err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            var maxBlocks = defMaxBlocks;
                            var blockNum = rows[0].blockCount;
                            if (maxBlocks > blockNum) {
                                maxBlocks = blockNum;
                            }
                            callback(null, connection, maxBlocks, blockNum);
                        }
                    });
                },
                function getBlocks(connection, maxBlocks, blockNum, callback) {
                    var blockNumFrom = maxBlocks * (page - 1);

                    var sql = 'SELECT * FROM blocks ORDER BY id DESC LIMIT ?,?';
                    connection.query(sql, [blockNumFrom, maxBlocks], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection, rows, blockNum, blockNumFrom, maxBlocks);
                        }
                    });
                }
            ],
            function (err, connection, blocks, total, blockNumFrom, maxBlocks)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    var result = {"total": total, "startNum":total - blockNumFrom, "endNum":total - blockNumFrom - maxBlocks + 1, "blocks":blocks};
                    _callback(null, result);
                }
            }
        );
    },

    getBlocksNumber: function(web3) {
        var blockNum = parseInt(web3.eth.blockNumber, 10);
        return blockNum;
    },

    getBlockInfo: function(pool, web3, async, blockId, _callback) {
        async.waterfall([
                function getConn(callback) {
                    pool.getConnection(function(err,conn) {
                        var connection = conn;
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection);
                        }
                    });
                },
                function getBlock(connection, callback) {
                    var sql = 'SELECT * FROM blocks WHERE number = ?';
                    connection.query(sql, [blockId], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            if (rows.length > 0) {
                                callback(null, connection, rows[0]);
                            } else {
                                callback("Invalid Id", connection);
                            }
                        }
                    });
                }
            ],
            function (err, connection, block)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    _callback(null, block);
                }
            }
        );
    },

    getRecentTxs: function(web3) {
        // #http://ethereum.stackexchange.com/questions/2531/common-useful-javascript-snippets-for-geth/3478#3478
        var maxTxs = defMaxTxs;
        var maxBlocks = 300;
        var blockNum = parseInt(web3.eth.blockNumber, 10);
        if (maxBlocks > blockNum) {
            maxBlocks = blockNum + 1;
        }

        var txs = [];
        var txCount = 0;
        for (var i = 0; i < maxBlocks; i++) {
            var block = web3.eth.getBlock(blockNum - i, true);
            for  (var i in block.transactions) {
                txs.push(block.transactions[i]);
                if ((++txCount) >= maxTxs) {
                    break;
                }
            }
            if (txCount >= maxTxs) {
                break;
            }
        }
        console.log("transactions:");
        console.log(txs);
    },

    getARecentTxs: function(pool, web3, async, _callback) {
        async.waterfall([
                function getConn(callback) {
                    pool.getConnection(function(err,conn) {
                        var connection = conn;
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection);
                        }
                    });
                },
                function getTxs(connection, callback) {
                    var sql = 'SELECT * FROM txs ORDER BY id DESC LIMIT ?,?';
                    connection.query(sql, [0, defMaxTxs], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection, rows);
                        }
                    });
                }
            ],
            function (err, connection, txs)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    _callback(null, txs);
                }
            }
        );
    },

    getTxs: function(pool, web3, page, async, _callback) {
        async.waterfall([
                function getConn(callback) {
                    pool.getConnection(function(err,conn) {
                        var connection = conn;
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection);
                        }
                    });
                },
                function getTxsCount(connection, callback) {
                    connection.query('SELECT COUNT(*) AS total FROM txs', function (err, rows) {
                       if (err) {
                           callback(err, connection);
                       } else {
                           var maxTxs = defMaxTxs;
                           var total = rows[0].total;
                           if (maxTxs > total) {
                               maxTxs = total;
                           }
                           callback(null, connection, maxTxs, total);
                       }
                    });
                },
                function getTxs(connection, maxTxs, total, callback) {
                    var txsNumFrom = maxTxs * (page - 1);
                    var sql = 'SELECT * FROM txs ORDER BY id DESC LIMIT ?,?';
                    connection.query(sql, [txsNumFrom, maxTxs], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection, rows, maxTxs, total, txsNumFrom);
                        }
                    });
                }
            ],
            function (err, connection, txs, maxTxs, total, txsNumFrom)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    var result = {"total": total, "startNum":total - txsNumFrom, "endNum":total - txsNumFrom - maxTxs + 1, "txs":txs};
                    _callback(null, result);
                }
            }
        );
    },

    getTxInfo: function(pool, web3, async, txHash, _callback) {
        async.waterfall([
                function getConn(callback) {
                    pool.getConnection(function(err,conn) {
                        var connection = conn;
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection);
                        }
                    });
                },
                function getTxs(connection, callback) {
                    var sql = 'SELECT * FROM txs WHERE hash = ?';
                    connection.query(sql, [txHash], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            if (rows.length > 0) {

                                callback(null, connection, rows[0]);

                            } else {

                                callback("Invalid Id", connection);

                            }
                        }
                    });
                }
            ],
            function (err, connection, tx)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    var result = {"tx": tx, "time":new Date(tx.timestamp * 1000).toUTCString()};
                    _callback(null, result);
                }
            }
        );
    },

    getAccounts: function(pool, web3, page, callback) {
        pool.getConnection(function(err,conn) {
            if (err) {
                callback(err, null);
            } else {
                var sql = "SELECT COUNT(*) AS total FROM accounts ";
                conn.query(sql, function(err, rows) {
                    if (err) {
                        callback(err, null);
                    } else {
                        var total = rows[0].total;
                        var maxAccounts = defMaxAccounts;

                        if (maxAccounts > total) {
                            maxAccounts = total;
                        }

                        var accountsNumFrom =  maxAccounts * (page - 1);

                        sql = "SELECT * FROM accounts ORDER BY id DESC LIMIT ?,?";
                        conn.query(sql, [accountsNumFrom, maxAccounts], function (err, rows) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (conn) {conn.release();}
                                /*var accounts = [];
                                for (var i in rows) {
                                    var accountRes = {"account": rows[i].account, "balance":web3.fromWei(web3.eth.getBalance(rows[i].account)), "txCount": web3.eth.getTransactionCount(rows[i].account)};
                                    accounts.push(accountRes);
                                }*/
                                var result = {"total": total, "startNum":total - accountsNumFrom, "endNum":total - accountsNumFrom - maxAccounts + 1, "accounts":rows};
                                callback(null, result);
                            }
                        });
                    }
                });
            }
        });
    },
    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },
    get_account_details: function(pool, web3, account_id, page, async, _callback) {
        //get transaction list
        async.waterfall([
                function getConn(callback) {
                    pool.getConnection(function(err,conn) {
                        var connection = conn;
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection);
                        }
                    });
                },
                function getTxsCount(connection, callback) {
                    connection.query('SELECT COUNT(*) AS total FROM txs WHERE from_addr=? OR to_addr=?', [account_id, account_id], function (err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            var maxTxs = defMaxTxs;
                            var total = rows[0].total;
                            if (maxTxs > total) {
                                maxTxs = total;
                            }
                            callback(null, connection, maxTxs, total);
                        }
                    });
                },
                function getTxs(connection, maxTxs, total, callback) {
                    var txsNumFrom = maxTxs * (page - 1);
                    var sql = 'SELECT * FROM txs WHERE from_addr=? OR to_addr=? ORDER BY id DESC LIMIT ?,?';
                    connection.query(sql, [account_id, account_id, txsNumFrom, maxTxs], function(err, rows) {
                        if (err) {
                            callback(err, connection);
                        } else {
                            callback(null, connection, rows, maxTxs, total, txsNumFrom);
                        }
                    });
                }
            ],
            function (err, connection, txs, maxTxs, total, txsNumFrom)
            {
                if (connection)
                {
                    connection.release();
                }

                if (err)
                {
                    _callback(err, null);
                } else {
                    var balance = web3.fromWei(web3.eth.getBalance(account_id), 'ether');
                    var tx_count = txs.length;//web3.eth.getTransactionCount(account_id);

                    //var result = {"total": total, "startNum":total - txsNumFrom, "endNum":total - txsNumFrom - maxTxs + 1, "txs":txs};
                    //_callback(null, result);

                    var result = {"balance": balance, "total": total, "tx_count": tx_count, "txs":txs, "startNum":total - txsNumFrom, "endNum":total - txsNumFrom - maxTxs + 1};
                    _callback(null, result);
                }
            }
        );
    },
    getFormatedBlock: function(block) {
        var formatedBlock = {};
        formatedBlock['version'] = block.version;
        formatedBlock['height'] = block.block_number;
        formatedBlock['hash'] = block.hash;
        formatedBlock['transaction_count'] = block.tx_count;
        formatedBlock['transactions'] = block.transactions;
        formatedBlock['transfers'] = block.transfers;
        formatedBlock['size'] = block.size;
        formatedBlock['script'] = JSON.parse(block.script);
        formatedBlock['time'] = block.time;
        formatedBlock['producer'] = block.next_consensus;
        formatedBlock['prev_block_hash'] = block.prev_block_hash;
        formatedBlock['merkle'] = block.merkle_root;

        return formatedBlock;
    },
    getFormatedBlockWithoutTransactions: function(block) {
        var formatedBlock = {};
        formatedBlock['height'] = block.block_number;
        formatedBlock['hash'] = block.hash;
        formatedBlock['transaction_count'] = block.tx_count;
        formatedBlock['size'] = block.size;
        formatedBlock['time'] = block.time;
        formatedBlock['producer'] = block.next_consensus;
        formatedBlock['prev_block_hash'] = block.prev_block_hash;
        formatedBlock['merkle'] = block.merkle_root;

        return formatedBlock;
    },
    getFormatedTx: function(tx) {
        var formatedTx = {};
        formatedTx.type = tx.tx_type;
        formatedTx.txid = tx.txid;
        formatedTx.block_time = tx.time;

        return formatedTx;
    },
    getFormatedTxInDetails: function(tx, vinUtxos, voutUtxos, exclusive) {
        var formatedTx = {};
        formatedTx.txid = tx.txid;
        formatedTx.version = tx.version;
        formatedTx.type = tx.tx_type;
        formatedTx.size = tx.size;
        formatedTx.vouts = voutUtxos;
        formatedTx.vins = vinUtxos;
        formatedTx.block_time = tx.time;
        formatedTx.sys_fee = tx.sys_fee;
        formatedTx.net_fee = tx.net_fee;
        formatedTx.block_height = tx.block_number;
        formatedTx.block_hash = tx.hash;
        formatedTx.attributes = tx.attribute;
        formatedTx.script = JSON.parse(tx.scripts);
        formatedTx.exclusive = exclusive;
        return formatedTx;
    },
    getFormatedStatus: function(status) {
        var formatedStatus = {};
        formatedStatus.version = status.block_version;
        formatedStatus.last_block_height = status.current_block_number;
        formatedStatus.last_block_time = status.last_block_time;

        return formatedStatus;
    },
    getFormatedNodes: function(nodes) {
        var formatedNodes = {};
        formatedNodes.total = nodes.length;
        formatedNodes.nodes = [];

        nodes.forEach(node => {
            var fNode = {};
            fNode.account = node.account;
            fNode.public_key = node.pub_key;
            fNode.votes = node.votes;
            fNode.votes_pecent = node.votes_pecent;
            fNode.url = node.url;
            fNode.position = node.position;
            fNode.daily_reward = [{
                asset_hash: "c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
                asset_symbol: "XQG",
                amount: node.daily_reward
            }];
            formatedNodes.nodes.push(fNode);
        });
        return formatedNodes;
    },
    getFormatedAddress: function(addresses, address, txs, unclaimed) {
        var formatedAddresses = {};
        var balances = [];
        var transactions = [];
        var transfers = [];

        if (addresses.length == 0)
		{
			formatedAddresses.address = address;
			formatedAddresses.balances = balances;
			formatedAddresses.unclaimed = unclaimed;
			formatedAddresses.transactions = transactions;
			formatedAddresses.transfers = transfers;  
			return formatedAddresses;
        }
        
        formatedAddresses.address = address;
        formatedAddresses.block_time = addresses[addresses.length - 1].time;
        formatedAddresses.last_block_time = addresses[0].time;

        addresses.forEach(addr => {
            if (addr.status == 'unspent') {
                var isFind = false;

                balances.forEach(balance => {
                    if (balance.asset_hash == addr.asset) {
                        isFind = true;
                        balance.amount += addr.value;
                    }
                });

                if (isFind == false) {
                    var balance = {
                        asset_hash: addr.asset,
                        asset_symbol: "",
                        amount: addr.value
                    };
                    balances.push(balance);
                }
            }
        });

        formatedAddresses.balances = balances;
        formatedAddresses.unclaimed = unclaimed;
        formatedAddresses.transfers = transfers;  
        formatedAddresses.transactions = txs;
        return formatedAddresses;
    },
    getFormatedAsset: function(asset, issuedAmount, addresses, transactions, transfers) {
        var formatedAsset = {};
        formatedAsset.hash = asset.txid.slice(2);
        formatedAsset.type = asset.type;
        formatedAsset.symbol = asset.name;
        formatedAsset.name = asset.name;
        formatedAsset.amount = asset.amount;
        formatedAsset.issued = issuedAmount;
        formatedAsset.precision = asset._precision;
        formatedAsset.admin = asset.admin;
        formatedAsset.owner = asset.owner;
        formatedAsset.block_time = asset.time;
        formatedAsset.addresses = addresses;
        formatedAsset.transactions = transactions;
        formatedAsset.transfers = transfers;

        return formatedAsset;
    },
    getFormatedAssets: function(assets) {
        var formatedAsset = {};
        formatedAsset.total = assets.length;
        var iAssets = [];

        assets.forEach(asset => {
            var item = {};
            item.hash = asset.txid;
            item.type = asset.type;
            item.symbol = asset.name;
            item.name = asset.name;
            item.amount = asset.amount;
            item.issued = asset.issuedAmount;
            item.precision = asset._precision;
            item.admin = asset.admin;
            item.owner = asset.owner;
            item.block_time = asset.time;
            item.address_count = asset.address_count;
            item.transaction_count = asset.transaction_count;
            iAssets.push(item);
        });
        
        formatedAsset.assets = iAssets;
        return formatedAsset;
    },
    getFormatedMyAssets: function(assets) {
        var formatedAsset = {};
        formatedAsset.total = assets.length;
        var iAssets = [];

        assets.forEach(asset => {
            var item = {};
            item.hash = asset.txid.slice(2);
            item.type = asset.type;
            item.symbol = asset.name;
            item.name = asset.name;
            item.amount = asset.amount;
            item.issued = asset.issuedAmount;
            item.precision = asset._precision;
            item.admin = asset.admin;
            item.owner = asset.owner;
            item.block_time = asset.time;
            item.address_count = asset.address_count;
            item.transaction_count = asset.transaction_count;
            iAssets.push(item);
        });
        
        formatedAsset.assets = iAssets;
        return formatedAsset;
    }
};