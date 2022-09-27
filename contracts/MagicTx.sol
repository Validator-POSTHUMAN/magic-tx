//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract MagicTx {
    event MagicTxData(address indexed sender, bytes data);

    fallback() external {
        magicTxData(msg.data);
    }

    function magicTxData(bytes calldata data) public {
        emit MagicTxData(msg.sender, data);
    }

    function magicTxMemo(string calldata memo) external {
        magicTxData(bytes(memo));
    }
}
