-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 30, 2019 at 02:51 PM
-- Server version: 10.1.30-MariaDB
-- PHP Version: 7.2.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quras_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `anonymous_contract_transaction`
--

CREATE TABLE `anonymous_contract_transaction` (
  `txid` varchar(255) NOT NULL,
  `byJoinSplit` text NOT NULL,
  `joinsplitPubkey` text NOT NULL,
  `joinsplitSig` int(11) NOT NULL,
  `_from` varchar(255) NOT NULL,
  `_to` varchar(255) NOT NULL,
  `asset` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `blocks`
--

CREATE TABLE `blocks` (
  `hash` varchar(256) CHARACTER SET utf8 NOT NULL,
  `size` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `prev_block_hash` varchar(256) CHARACTER SET utf8 NOT NULL,
  `merkle_root` varchar(256) CHARACTER SET utf8 NOT NULL,
  `time` int(11) NOT NULL,
  `block_number` int(11) NOT NULL,
  `nonce` int(11) NOT NULL,
  `next_consensus` varchar(256) CHARACTER SET utf8 NOT NULL,
  `script` varchar(512) CHARACTER SET utf8 NOT NULL,
  `tx_count` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `claim_transaction`
--

CREATE TABLE `claim_transaction` (
  `txid` varchar(255) NOT NULL,
  `claims` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `contract_transaction`
--

CREATE TABLE `contract_transaction` (
  `txid` varchar(255) NOT NULL,
  `_from` text NOT NULL,
  `_to` text NOT NULL,
  `asset` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `enrollment_transaction`
--

CREATE TABLE `enrollment_transaction` (
  `txid` varchar(255) NOT NULL,
  `pubkey` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `invocation_transaction`
--

CREATE TABLE `invocation_transaction` (
  `txid` varchar(255) NOT NULL,
  `script` text NOT NULL,
  `gas` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `issue_transaction`
--

CREATE TABLE `issue_transaction` (
  `txid` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `miner_transaction`
--

CREATE TABLE `miner_transaction` (
  `txid` varchar(255) NOT NULL,
  `nonce` int(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `nodes`
--

CREATE TABLE `nodes` (
  `id` int(11) NOT NULL,
  `url` text NOT NULL,
  `height` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `publish_transaction`
--

CREATE TABLE `publish_transaction` (
  `txid` varchar(255) NOT NULL,
  `contract_code_hash` text NOT NULL,
  `contract_code_script` text NOT NULL,
  `contract_code_parameters` text NOT NULL,
  `contract_code_returntype` text NOT NULL,
  `contract_needstorage` text NOT NULL,
  `contract_name` text NOT NULL,
  `contract_version` text NOT NULL,
  `contract_author` text NOT NULL,
  `contract_email` text NOT NULL,
  `contract_description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `register_transaction`
--

CREATE TABLE `register_transaction` (
  `txid` varchar(255) NOT NULL,
  `type` text NOT NULL,
  `name` text NOT NULL,
  `amount` text NOT NULL,
  `_precision` text NOT NULL,
  `owner` text NOT NULL,
  `admin` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `state_transaction`
--

CREATE TABLE `state_transaction` (
  `txid` varchar(255) NOT NULL,
  `descriptors` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `status`
--

CREATE TABLE `status` (
  `id` int(11) NOT NULL,
  `current_block_number` int(11) NOT NULL,
  `last_block_time` int(11) NOT NULL,
  `block_version` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `txid` varchar(255) CHARACTER SET utf8 NOT NULL,
  `size` int(11) NOT NULL,
  `tx_type` varchar(255) CHARACTER SET utf8 NOT NULL,
  `version` int(11) NOT NULL,
  `attribute` text CHARACTER SET utf8 NOT NULL,
  `vin` text CHARACTER SET utf8 NOT NULL,
  `vout` text CHARACTER SET utf8 NOT NULL,
  `sys_fee` int(11) NOT NULL,
  `net_fee` int(11) NOT NULL,
  `scripts` text CHARACTER SET utf8 NOT NULL,
  `nonce` int(11) NOT NULL,
  `block_number` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `utxos`
--

CREATE TABLE `utxos` (
  `txid` varchar(255) NOT NULL,
  `tx_out_index` int(11) NOT NULL,
  `asset` varchar(255) NOT NULL,
  `value` bigint(20) NOT NULL,
  `address` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `claimed` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `anonymous_contract_transaction`
--
ALTER TABLE `anonymous_contract_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `blocks`
--
ALTER TABLE `blocks`
  ADD PRIMARY KEY (`block_number`);

--
-- Indexes for table `claim_transaction`
--
ALTER TABLE `claim_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `contract_transaction`
--
ALTER TABLE `contract_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `enrollment_transaction`
--
ALTER TABLE `enrollment_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `invocation_transaction`
--
ALTER TABLE `invocation_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `issue_transaction`
--
ALTER TABLE `issue_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `miner_transaction`
--
ALTER TABLE `miner_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `nodes`
--
ALTER TABLE `nodes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `publish_transaction`
--
ALTER TABLE `publish_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `register_transaction`
--
ALTER TABLE `register_transaction`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`txid`);

--
-- Indexes for table `utxos`
--
ALTER TABLE `utxos`
  ADD PRIMARY KEY (`txid`,`tx_out_index`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `nodes`
--
ALTER TABLE `nodes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
