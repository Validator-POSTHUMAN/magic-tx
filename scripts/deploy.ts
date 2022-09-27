import { ethers } from "hardhat";

async function main() {
  const MagicTx = await ethers.getContractFactory("MagicTx");
  const mTx = await MagicTx.deploy();

  await mTx.deployed();

  console.log(`MagicTx deployed to ${mTx.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
